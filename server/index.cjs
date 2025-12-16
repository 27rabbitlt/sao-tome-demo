// São Tomé Island Farmers - Game Server (CommonJS)
const { Server, Origins } = require('boardgame.io/server');
const { TurnOrder } = require('boardgame.io/core');

// Game constants
const CONSTANTS = {
  INITIAL_COCOA: 10,
  INITIAL_WOOD: 5,
  INITIAL_SNAILS: 0,
  INITIAL_POPULATION: 3,
  INITIAL_LANDS: 3,
  ACTION_COST: 1,
  POPULATION_MAINTENANCE: 2,
  COCOA_HARVEST_AMOUNT: 5,
  COCOA_GROWTH_ROUNDS: 2,
  TREE_CUT_WOOD: 3,
  TREE_CUT_PRESSURE: 5,
  ILLEGAL_LOGGING_WOOD: 5,
  ILLEGAL_LOGGING_PRESSURE: 10,
  ILLEGAL_LOGGING_CATCH_CHANCE: 0.3,
  SNAIL_HUNT_AMOUNT: 2,
  SNAIL_HUNT_PRESSURE: 3,
  SNAIL_TO_COCOA_RATE: 2,
  STEAL_AMOUNT: 3,
  STEAL_CATCH_CHANCE: 0.4,
  LAND_IMPROVE_COST: 3,
  ECOSYSTEM_THRESHOLD: 50,
  ECOSYSTEM_CRITICAL: 80,
  WIN_COCOA_TARGET: 50,
  MAX_ROUNDS: 10,
};

const generateId = () => Math.random().toString(36).substr(2, 9);

function createInitialLands(count) {
  const lands = [];
  for (let i = 0; i < count; i++) {
    lands.push({
      id: generateId(),
      quality: Math.floor(Math.random() * 3) + 2,
      hasCocoa: false,
      cocoaGrowthStage: 0,
      hasTree: Math.random() > 0.5,
    });
  }
  return lands;
}

function createPlayer(id, name) {
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

function addEvent(G, message, type = 'info') {
  G.events.push({
    round: G.currentRound,
    phase: G.phase === 'nightReveal' ? 'night' : G.phase,
    message,
    type,
  });
}

function checkEcosystemEffects(G) {
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

function getMaintenanceCost(player, G) {
  let cost = player.population * CONSTANTS.POPULATION_MAINTENANCE;
  if (G.ecosystemPressure >= CONSTANTS.ECOSYSTEM_THRESHOLD) {
    cost = Math.floor(cost * 1.5);
  }
  return cost;
}

function growCocoa(G) {
  Object.values(G.players).forEach(player => {
    player.lands.forEach(land => {
      if (land.hasCocoa && land.cocoaGrowthStage < 3) {
        land.cocoaGrowthStage++;
      }
    });
  });
}

function processEndOfRound(G) {
  Object.values(G.players).forEach(player => {
    const cost = getMaintenanceCost(player, G);
    player.cocoa -= cost;
    if (player.cocoa < 0) {
      player.population = Math.max(1, player.population - 1);
      player.cocoa = 0;
      addEvent(G, `😢 ${player.name} 的家庭挨饿了，人口减少！`, 'danger');
    }
  });

  growCocoa(G);
  checkEcosystemEffects(G);
  G.ecosystemPressure = Math.max(0, G.ecosystemPressure - 2);
  G.currentRound++;
  
  Object.values(G.players).forEach(player => {
    player.actionPoints = player.population;
    player.hasDefense = false;
    delete player.secretAction;
  });
  G.dayActionsThisRound = {};
  G.nightActionsRevealed = false;

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

function processNightActions(G) {
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

// Game definition
const SaoTomeGame = {
  name: 'sao-tome-farmers',

  setup: ({ ctx }) => {
    const players = {};
    const turnOrder = [];
    const names = ['阿明', '小红', '老王', '阿花', '大壮'];

    for (let i = 0; i < ctx.numPlayers; i++) {
      const id = String(i);
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
    };
  },

  phases: {
    // Day phase: players take turns
    day: {
      start: true,
      moves: {
        plantCocoa: ({ G, playerID }, landId) => {
          const player = G.players[playerID];
          if (!player || player.actionPoints < CONSTANTS.ACTION_COST) return;
          const land = player.lands.find(l => l.id === landId);
          if (!land || land.hasCocoa) return;
          land.hasCocoa = true;
          land.cocoaGrowthStage = 0;
          player.actionPoints -= CONSTANTS.ACTION_COST;
          addEvent(G, `🌱 ${player.name} 种植了可可树`, 'info');
          if (!G.dayActionsThisRound[playerID]) G.dayActionsThisRound[playerID] = [];
          G.dayActionsThisRound[playerID].push({ type: 'plant_cocoa', landId });
        },

        harvestCocoa: ({ G, playerID }, landId) => {
          const player = G.players[playerID];
          if (!player || player.actionPoints < CONSTANTS.ACTION_COST) return;
          const land = player.lands.find(l => l.id === landId);
          if (!land || !land.hasCocoa || land.cocoaGrowthStage < 3) return;
          const harvest = CONSTANTS.COCOA_HARVEST_AMOUNT + land.quality;
          player.cocoa += harvest;
          land.hasCocoa = false;
          land.cocoaGrowthStage = 0;
          player.actionPoints -= CONSTANTS.ACTION_COST;
          addEvent(G, `🍫 ${player.name} 收获了 ${harvest} 可可`, 'success');
          if (!G.dayActionsThisRound[playerID]) G.dayActionsThisRound[playerID] = [];
          G.dayActionsThisRound[playerID].push({ type: 'harvest_cocoa', landId });
        },

        cutTree: ({ G, playerID }, landId) => {
          const player = G.players[playerID];
          if (!player || player.actionPoints < CONSTANTS.ACTION_COST) return;
          const land = player.lands.find(l => l.id === landId);
          if (!land || !land.hasTree) return;
          land.hasTree = false;
          player.wood += CONSTANTS.TREE_CUT_WOOD;
          G.ecosystemPressure += CONSTANTS.TREE_CUT_PRESSURE;
          player.actionPoints -= CONSTANTS.ACTION_COST;
          addEvent(G, `🪓 ${player.name} 砍伐了树木，获得 ${CONSTANTS.TREE_CUT_WOOD} 木材`, 'info');
          if (!G.dayActionsThisRound[playerID]) G.dayActionsThisRound[playerID] = [];
          G.dayActionsThisRound[playerID].push({ type: 'cut_tree', landId });
        },

        improveLand: ({ G, playerID }, landId) => {
          const player = G.players[playerID];
          if (!player || player.actionPoints < CONSTANTS.ACTION_COST) return;
          if (player.wood < CONSTANTS.LAND_IMPROVE_COST) return;
          const land = player.lands.find(l => l.id === landId);
          if (!land || land.quality >= 5) return;
          land.quality++;
          player.wood -= CONSTANTS.LAND_IMPROVE_COST;
          player.actionPoints -= CONSTANTS.ACTION_COST;
          addEvent(G, `⬆️ ${player.name} 改善了土地质量`, 'success');
          if (!G.dayActionsThisRound[playerID]) G.dayActionsThisRound[playerID] = [];
          G.dayActionsThisRound[playerID].push({ type: 'improve_land', landId });
        },

        endTurn: ({ G, playerID, events }) => {
          const player = G.players[playerID];
          addEvent(G, `⏭️ ${player.name} 结束了回合`, 'info');
          events.endTurn();
        },
      },
      turn: {
        order: TurnOrder.DEFAULT,
      },
      next: 'night',
      onBegin: ({ G }) => {
        G.phase = 'day';
      },
    },

    // Night phase: players select secret actions
    night: {
      moves: {
        setNightAction: ({ G, playerID, events }, action) => {
          const player = G.players[playerID];
          if (!player) return;
          player.secretAction = action;
          events.endTurn();
        },
      },
      turn: {
        order: TurnOrder.DEFAULT,
      },
      next: 'nightReveal',
      onBegin: ({ G }) => {
        G.phase = 'night';
        addEvent(G, '🌙 夜幕降临，轮流选择秘密行动...', 'info');
      },
      endIf: ({ G }) => {
        const allSelected = Object.values(G.players).every(p => p.secretAction);
        return allSelected;
      },
    },

    // Reveal phase
    nightReveal: {
      moves: {},
      onBegin: ({ G }) => {
        G.phase = 'nightReveal';
        processNightActions(G);
      },
      endIf: () => true,
      next: 'dayEnd',
    },

    // Day end phase
    dayEnd: {
      moves: {},
      onBegin: ({ G }) => {
        processEndOfRound(G);
      },
      endIf: () => true,
      next: ({ G }) => {
        if (G.phase === 'gameEnd') {
          return undefined;
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

// Create and start server
const server = Server({
  games: [SaoTomeGame],
  // origins: '*',
  origins: [
    Origins.LOCALHOST,
    Origins.LOCALHOST_IN_DEVELOPMENT,
    '*',
    'http://192.168.0.102:5173',
  ],
});

const PORT = Number(process.env.PORT) || 8000;

server.run(PORT, () => {
  console.log(`
🏝️  圣多美岛农民 - 游戏服务器已启动！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 服务器地址: http://localhost:${PORT}
📡 等待玩家连接...

游戏流程:
1. 白天阶段: 玩家轮流行动
2. 夜晚阶段: 玩家轮流选择秘密行动
3. 揭示阶段: 公布所有夜间行动
4. 回合结算: 维护费用、可可生长

使用方法:
1. 确保前端也在运行 (npm run dev)
2. 在游戏大厅选择"创建房间"
3. 将房间 ID 分享给朋友
4. 朋友选择"加入房间"并输入 ID

局域网联机:
- Windows: 在 CMD 运行 ipconfig 查看 IPv4 地址
- 朋友连接 http://你的IP:5173
- 服务器地址改为 http://你的IP:${PORT}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});
