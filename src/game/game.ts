// São Tomé Island Farmers - Game Logic
import type { Game, Move } from 'boardgame.io';
import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import type { 
  GameState, 
  Player, 
  Land, 
  NightAction,
  GameEvent 
} from './types';
import { CONSTANTS } from './types';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Create initial land for a player
function createInitialLands(count: number): Land[] {
  const lands: Land[] = [];
  for (let i = 0; i < count; i++) {
    lands.push({
      id: generateId(),
      quality: Math.floor(Math.random() * 3) + 2, // 2-4 initial quality
      hasCocoa: false,
      cocoaGrowthStage: 0,
      hasTree: Math.random() > 0.5, // 50% chance to have tree
    });
  }
  return lands;
}

// Create initial player state
function createPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    cocoa: CONSTANTS.INITIAL_COCOA,
    wood: CONSTANTS.INITIAL_WOOD,
    snails: CONSTANTS.INITIAL_SNAILS,
    population: CONSTANTS.INITIAL_POPULATION,
    actionPoints: CONSTANTS.INITIAL_POPULATION,
    lands: createInitialLands(CONSTANTS.INITIAL_LANDS),
    hasDefense: false,
  };
}

// Add event to game log
function addEvent(G: GameState, message: string, type: GameEvent['type'] = 'info') {
  G.events.push({
    round: G.currentRound,
    phase: G.phase === 'nightReveal' ? 'night' : G.phase as 'day' | 'night',
    message,
    type,
  });
}

// Check for ecosystem consequences
function checkEcosystemEffects(G: GameState) {
  if (G.ecosystemPressure >= CONSTANTS.ECOSYSTEM_CRITICAL) {
    addEvent(G, '🌋 生态系统濒临崩溃！所有土地质量下降！', 'danger');
    Object.values(G.players).forEach(player => {
      player.lands.forEach(land => {
        land.quality = Math.max(1, land.quality - 1);
      });
    });
  } else if (G.ecosystemPressure >= CONSTANTS.ECOSYSTEM_THRESHOLD) {
    addEvent(G, '⚠️ 生态压力过高，维持成本增加！', 'warning');
  }
}

// Calculate maintenance cost
function getMaintenanceCost(player: Player, G: GameState): number {
  let cost = player.population * CONSTANTS.POPULATION_MAINTENANCE;
  if (G.ecosystemPressure >= CONSTANTS.ECOSYSTEM_THRESHOLD) {
    cost = Math.floor(cost * 1.5);
  }
  return cost;
}

// Grow cocoa on all lands
function growCocoa(G: GameState) {
  Object.values(G.players).forEach(player => {
    player.lands.forEach(land => {
      if (land.hasCocoa && land.cocoaGrowthStage < 3) {
        land.cocoaGrowthStage++;
      }
    });
  });
}

// Process end of round (after night phase)
function processEndOfRound(G: GameState) {
  // Maintenance phase
  Object.values(G.players).forEach(player => {
    const cost = getMaintenanceCost(player, G);
    player.cocoa -= cost;
    if (player.cocoa < 0) {
      player.population = Math.max(1, player.population - 1);
      player.cocoa = 0;
      addEvent(G, `😢 ${player.name} 的家庭挨饿了，人口减少！`, 'danger');
    }
  });

  // Grow cocoa
  growCocoa(G);

  // Check ecosystem
  checkEcosystemEffects(G);

  // Natural ecosystem recovery
  G.ecosystemPressure = Math.max(0, G.ecosystemPressure - 2);

  // Reset for next round
  G.currentRound++;
  Object.values(G.players).forEach(player => {
    player.actionPoints = player.population;
    player.hasDefense = false;
    delete player.secretAction;
  });
  G.dayActionsThisRound = {};
  G.nightActionsRevealed = false;
  G.playersEndedDay = [];

  // Check win condition
  const winner = Object.values(G.players).find(p => p.cocoa >= CONSTANTS.WIN_COCOA_TARGET);
  if (winner) {
    G.winner = winner.id;
    G.phase = 'gameEnd';
    addEvent(G, `🎉 ${winner.name} 获得了胜利！`, 'success');
  } else if (G.currentRound > CONSTANTS.MAX_ROUNDS) {
    const richest = Object.values(G.players).reduce((a, b) => a.cocoa > b.cocoa ? a : b);
    G.winner = richest.id;
    G.phase = 'gameEnd';
    addEvent(G, `🎉 游戏结束！${richest.name} 拥有最多可可，获胜！`, 'success');
  }
}

// Process night actions
function processNightActions(G: GameState) {
  Object.values(G.players).forEach(player => {
    const action = player.secretAction;
    if (!action) {
      addEvent(G, `😴 ${player.name} 选择了睡觉`, 'info');
      return;
    }

    switch (action.type) {
      case 'illegal_logging': {
        const caught = Math.random() < CONSTANTS.ILLEGAL_LOGGING_CATCH_CHANCE;
        if (caught) {
          player.cocoa = Math.max(0, player.cocoa - 5);
          addEvent(G, `🚨 ${player.name} 非法伐木被抓！罚款 5 可可`, 'danger');
        } else {
          player.wood += CONSTANTS.ILLEGAL_LOGGING_WOOD;
          G.ecosystemPressure += CONSTANTS.ILLEGAL_LOGGING_PRESSURE;
          addEvent(G, `🌲 ${player.name} 秘密伐木获得 ${CONSTANTS.ILLEGAL_LOGGING_WOOD} 木材`, 'warning');
        }
        break;
      }

      case 'hunt_snails': {
        player.snails += CONSTANTS.SNAIL_HUNT_AMOUNT;
        player.cocoa += CONSTANTS.SNAIL_HUNT_AMOUNT * CONSTANTS.SNAIL_TO_COCOA_RATE;
        G.ecosystemPressure += CONSTANTS.SNAIL_HUNT_PRESSURE;
        addEvent(G, `🐌 ${player.name} 猎捕蜗牛获得 ${CONSTANTS.SNAIL_HUNT_AMOUNT * CONSTANTS.SNAIL_TO_COCOA_RATE} 可可`, 'info');
        break;
      }

      case 'steal_cocoa': {
        if (!action.targetPlayerId) break;
        const target = G.players[action.targetPlayerId];
        if (!target) break;

        if (target.hasDefense) {
          player.cocoa = Math.max(0, player.cocoa - 3);
          addEvent(G, `🛡️ ${player.name} 试图偷窃 ${target.name}，但被陷阱抓住！`, 'danger');
        } else {
          const caught = Math.random() < CONSTANTS.STEAL_CATCH_CHANCE;
          if (caught) {
            player.cocoa = Math.max(0, player.cocoa - 3);
            addEvent(G, `👮 ${player.name} 偷窃 ${target.name} 时被发现！`, 'danger');
          } else {
            const stolen = Math.min(target.cocoa, CONSTANTS.STEAL_AMOUNT);
            target.cocoa -= stolen;
            player.cocoa += stolen;
            addEvent(G, `🦝 ${player.name} 成功从 ${target.name} 偷取了 ${stolen} 可可`, 'warning');
          }
        }
        break;
      }

      case 'set_defense': {
        player.hasDefense = true;
        addEvent(G, `🛡️ ${player.name} 设置了防御陷阱`, 'info');
        break;
      }

      case 'sabotage_land': {
        if (!action.targetPlayerId) break;
        const target = G.players[action.targetPlayerId];
        if (!target) break;

        if (target.hasDefense) {
          addEvent(G, `🛡️ ${player.name} 试图破坏 ${target.name} 的土地，但被发现！`, 'danger');
        } else {
          const targetLand = target.lands[Math.floor(Math.random() * target.lands.length)];
          if (targetLand) {
            targetLand.quality = Math.max(1, targetLand.quality - 1);
            if (targetLand.hasCocoa) {
              targetLand.hasCocoa = false;
              targetLand.cocoaGrowthStage = 0;
            }
            addEvent(G, `💀 ${player.name} 破坏了 ${target.name} 的一块土地！`, 'danger');
          }
        }
        break;
      }

      case 'sleep':
      default:
        addEvent(G, `😴 ${player.name} 安静地睡觉了`, 'info');
    }
  });

  G.nightActionsRevealed = true;
}

// ============ Day Phase Moves ============
const plantCocoa: Move<GameState> = ({ G, playerID }, landId: string) => {
  if (!playerID) return INVALID_MOVE;
  const player = G.players[playerID];
  if (!player || player.actionPoints < CONSTANTS.ACTION_COST) return INVALID_MOVE;

  const land = player.lands.find(l => l.id === landId);
  if (!land || land.hasCocoa) return INVALID_MOVE;

  land.hasCocoa = true;
  land.cocoaGrowthStage = 0;
  player.actionPoints -= CONSTANTS.ACTION_COST;

  addEvent(G, `🌱 ${player.name} 种植了可可树`, 'info');
  
  if (!G.dayActionsThisRound[playerID]) G.dayActionsThisRound[playerID] = [];
  G.dayActionsThisRound[playerID].push({ type: 'plant_cocoa', landId });
};

const harvestCocoa: Move<GameState> = ({ G, playerID }, landId: string) => {
  if (!playerID) return INVALID_MOVE;
  const player = G.players[playerID];
  if (!player || player.actionPoints < CONSTANTS.ACTION_COST) return INVALID_MOVE;

  const land = player.lands.find(l => l.id === landId);
  if (!land || !land.hasCocoa || land.cocoaGrowthStage < 3) return INVALID_MOVE;

  const harvest = CONSTANTS.COCOA_HARVEST_AMOUNT + land.quality;
  player.cocoa += harvest;
  land.hasCocoa = false;
  land.cocoaGrowthStage = 0;
  player.actionPoints -= CONSTANTS.ACTION_COST;

  addEvent(G, `🍫 ${player.name} 收获了 ${harvest} 可可`, 'success');

  if (!G.dayActionsThisRound[playerID]) G.dayActionsThisRound[playerID] = [];
  G.dayActionsThisRound[playerID].push({ type: 'harvest_cocoa', landId });
};

const cutTree: Move<GameState> = ({ G, playerID }, landId: string) => {
  if (!playerID) return INVALID_MOVE;
  const player = G.players[playerID];
  if (!player || player.actionPoints < CONSTANTS.ACTION_COST) return INVALID_MOVE;

  const land = player.lands.find(l => l.id === landId);
  if (!land || !land.hasTree) return INVALID_MOVE;

  land.hasTree = false;
  player.wood += CONSTANTS.TREE_CUT_WOOD;
  G.ecosystemPressure += CONSTANTS.TREE_CUT_PRESSURE;
  player.actionPoints -= CONSTANTS.ACTION_COST;

  addEvent(G, `🪓 ${player.name} 砍伐了树木，获得 ${CONSTANTS.TREE_CUT_WOOD} 木材`, 'info');

  if (!G.dayActionsThisRound[playerID]) G.dayActionsThisRound[playerID] = [];
  G.dayActionsThisRound[playerID].push({ type: 'cut_tree', landId });
};

const improveLand: Move<GameState> = ({ G, playerID }, landId: string) => {
  if (!playerID) return INVALID_MOVE;
  const player = G.players[playerID];
  if (!player || player.actionPoints < CONSTANTS.ACTION_COST) return INVALID_MOVE;
  if (player.wood < CONSTANTS.LAND_IMPROVE_COST) return INVALID_MOVE;

  const land = player.lands.find(l => l.id === landId);
  if (!land || land.quality >= 5) return INVALID_MOVE;

  land.quality++;
  player.wood -= CONSTANTS.LAND_IMPROVE_COST;
  player.actionPoints -= CONSTANTS.ACTION_COST;

  addEvent(G, `⬆️ ${player.name} 改善了土地质量`, 'success');

  if (!G.dayActionsThisRound[playerID]) G.dayActionsThisRound[playerID] = [];
  G.dayActionsThisRound[playerID].push({ type: 'improve_land', landId });
};

// End current player's turn (pass to next player)
const endTurn: Move<GameState> = ({ G, playerID, events }) => {
  if (!playerID) return INVALID_MOVE;
  const player = G.players[playerID];
  
  // Mark this player as having ended their day turn
  if (!G.playersEndedDay.includes(playerID)) {
    G.playersEndedDay.push(playerID);
  }
  
  addEvent(G, `⏭️ ${player.name} 结束了回合`, 'info');
  events.endTurn();
};

// ============ Night Phase Moves ============
const setNightAction: Move<GameState> = ({ G, playerID, events }, action: NightAction) => {
  if (!playerID) return INVALID_MOVE;
  const player = G.players[playerID];
  if (!player) return INVALID_MOVE;

  player.secretAction = action;
  // After selecting night action, end turn to let next player choose
  events.endTurn();
};

// ============ Game Definition ============
export const SaoTomeGame: Game<GameState> = {
  name: 'sao-tome-farmers',

  setup: ({ ctx }): GameState => {
    const players: Record<string, Player> = {};
    const turnOrder: string[] = [];

    for (let i = 0; i < ctx.numPlayers; i++) {
      const id = String(i);
      const names = ['阿明', '小红', '老王', '阿花', '大壮'];
      players[id] = createPlayer(id, names[i] || `农民${i + 1}`);
      turnOrder.push(id);
    }

    return {
      players,
      currentRound: 1,
      phase: 'day',
      ecosystemPressure: 0,
      events: [{ round: 1, phase: 'day', message: '☀️ 游戏开始！第 1 回合', type: 'info' }],
      dayActionsThisRound: {},
      nightActionsRevealed: false,
      turnOrder,
      playersEndedDay: [],
    };
  },

  phases: {
    // Day phase: players take turns, each can do multiple actions
    day: {
      start: true,
      moves: { plantCocoa, harvestCocoa, cutTree, improveLand, endTurn },
      turn: {
        order: TurnOrder.DEFAULT,
      },
      endIf: ({ G, ctx }) => {
        // Day phase ends when all players have ended their turn
        const numPlayers = ctx.numPlayers;
        const allPlayersEnded = G.playersEndedDay.length >= numPlayers;
        return allPlayersEnded;
      },
      next: 'night',
      onBegin: ({ G }) => {
        G.phase = 'day';
        // Reset the list of players who ended their day turn
        G.playersEndedDay = [];
      },
    },

    // Night phase: players take turns selecting secret actions
    night: {
      moves: { setNightAction },
      turn: {
        order: TurnOrder.DEFAULT,
      },
      next: 'nightReveal',
      onBegin: ({ G }) => {
        G.phase = 'night';
        addEvent(G, '🌙 夜幕降临，轮流选择秘密行动...', 'info');
      },
      endIf: ({ G }) => {
        // End when all players have selected their night action
        const allSelected = Object.values(G.players).every(p => p.secretAction);
        return allSelected;
      },
    },

    // Reveal phase: show all night actions and process
    nightReveal: {
      moves: {},
      onBegin: ({ G }) => {
        G.phase = 'nightReveal';
        processNightActions(G);
      },
      endIf: () => true, // Immediately end
      next: 'dayEnd',
    },

    // Day end: process end of round and check win condition
    dayEnd: {
      moves: {},
      onBegin: ({ G }) => {
        processEndOfRound(G);
      },
      endIf: () => true,
      next: ({ G }) => {
        if (G.phase === 'gameEnd') {
          return undefined; // Game over
        }
        return 'day';
      },
      onEnd: ({ G }) => {
        if (G.phase !== 'gameEnd') {
          addEvent(G, `☀️ 第 ${G.currentRound} 回合开始`, 'info');
        }
      },
    },
  },

  endIf: ({ G }) => {
    if (G.phase === 'gameEnd' && G.winner) {
      return { winner: G.winner };
    }
  },
};
