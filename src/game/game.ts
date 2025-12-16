// game.ts
// boardgame.io Game 配置
import type { Game, Ctx } from 'boardgame.io';
import { TurnOrder } from 'boardgame.io/core';
import type { GameState } from './core_data_structure';
import {
  initializeGame,
  calculateSnailPopulation,
  calculateTreeRegrowth,
  calculateLivingCost,
  getCocoaYield,
  resolveSecretActions,
} from './game_logic';

import { isNeighbor } from './game_utils';

// 定义 boardgame.io 的 G 类型（与 GameState 相同）
export interface G extends GameState {}


// 定义游戏配置
export const SaoTomeGame: Game<G> = {
  name: 'sao-tome-farmers',

  // 初始化游戏状态
  setup: ({ ctx }): G => {
    const gameState = initializeGame();
    
    // 确保玩家数量匹配 boardgame.io 的配置
    // 如果 ctx.numPlayers 不是 5，需要调整玩家数组
    if (gameState.players.length !== ctx.numPlayers) {
      // 只取前 ctx.numPlayers 个玩家
      gameState.players = gameState.players.slice(0, ctx.numPlayers);
    }
    
    return gameState;
  },

  // 添加设置玩家名字的 move（可以在任何阶段使用）
  moves: {
    setPlayerName: ({ G, ctx }: { G: G; ctx: Ctx }, playerId: number, name: string) => {
      const player = G.players.find(p => p.id === playerId);
      if (player && name.trim()) {
        player.name = name.trim();
      }
    },
    setMyName: ({ G, ctx }: { G: G; ctx: Ctx }, name: string) => {
      const playerId = parseInt(ctx.currentPlayer);
      const player = G.players.find(p => p.id === playerId);
      if (player && name.trim()) {
        player.name = name.trim();
      }
    },
  },

  // 阶段定义
  phases: {
    // registration: {
    //   start: true,
    //   next: 'action',
    //   activePlayers: { ActivePlayers.ALL },
    //   endIf: ({ G, ctx }: { G: G; ctx: Ctx }) => {
    //     return G.players.every((p) => p.isReady);
    //   },
    //   moves: {
    //     setName: ({G, ctx, playerId}: {G: G; ctx: Ctx; playerId: number}, name: string) => {
    //       G.players[playerId].name = name;
    //       G.players[playerId].isReady = true;
    //     }
    //   }
    // },
    // 市政厅讨论阶段
    // townHall: {
    //   next: 'action', // 下一阶段是 action
    //   endIf: () => true, // 立即结束，自动转换到下一阶段
    //   onBegin: ({ G, ctx, events }: { G: G; ctx: Ctx; events?: any }) => {
    //     // Start of Round 逻辑
        
    //     // A. 推进回合数
    //     // 如果是游戏第一轮初始化，Round 已经是 1，不需要再加
    //     // 否则，在进入 TownHall 前，Round + 1
    //     // 判断是否是第一次进入：检查是否是游戏刚开始（round === 1 且 logs 为空）
    //     const isFirstRound = G.round === 1 && G.logs.length === 0;
        
    //     if (!isFirstRound) {
    //       // 不是第一次，说明是从 calculation 阶段过来的，需要增加 round
    //       G.round += 1;
    //       G.logs.push(`进入第 ${G.round} 轮`);
    //     }
        
    //     // B. 触发特殊事件
    //     if (G.round === 2) {
    //       // Round 2: Population Boom - 所有玩家 workers 设置为 3
    //       G.players.forEach((player) => {
    //         player.workers = 3;
    //       });
    //       G.logs.push(`第 2 轮：人口增长！所有玩家工人数量增加到 3`);
    //     } else if (G.round === 3) {
    //       // Round 3: Climate Change - 反转土壤质量
    //       G.players.forEach((player) => {
    //         // 反转土壤质量
    //         let newSoilQuality: 'GOOD' | 'MEDIUM' | 'BAD';
    //         if (player.soilQuality === 'GOOD') {
    //           newSoilQuality = 'BAD'; // 原 GOOD -> 变 BAD
    //         } else if (player.soilQuality === 'MEDIUM') {
    //           newSoilQuality = 'MEDIUM'; // 原 MEDIUM -> 保持不变
    //         } else {
    //           newSoilQuality = 'GOOD'; // 原 BAD -> 变 GOOD
    //         }
            
    //         player.soilQuality = newSoilQuality;
            
    //         // 同步更新玩家名下所有 FARM 格子的 soilQuality
    //         G.cells.forEach((cell) => {
    //           if (cell.type === 'FARM' && cell.owner === String(player.id)) {
    //             cell.soilQuality = newSoilQuality;
    //           }
    //         });
    //       });
    //       G.logs.push(`第 3 轮：气候变化！土壤质量发生反转`);
    //     }
        
    //     // C. 支付生活成本与葡萄牙机制
    //     G.players.forEach((player) => {
    //       // 1. 计算应付成本
    //       const costTimber = 1; // 固定为 1，每户只消耗1木材，与工人数无关
    //       const costCocoa = (1 * player.workers) + G.taxPenalty; // 基础人头费 + 环境罚款
          
    //       // 2. 支付判定
    //       if (player.timber >= costTimber && player.cocoa >= costCocoa) {
    //         // 能够支付：扣除相应资源
    //         player.timber -= costTimber;
    //         player.cocoa -= costCocoa;
    //         // 确保标记清除
    //         player.inPortugal = 0;
    //         G.logs.push(`玩家 ${player.id} 支付生活成本：${costTimber} 木材 + ${costCocoa} 可可`);
    //       } else {
    //         // 无法支付：破产
    //         // 破产扣除：将玩家现有的 timber 和 cocoa 全部清零
    //         const lostTimber = player.timber;
    //         const lostCocoa = player.cocoa;
    //         player.timber = 0;
    //         player.cocoa = 0;
            
    //         // 送去葡萄牙
    //         player.workers = Math.max(1, player.workers - 1); // 减少劳动力，但至少保留1个
    //         player.inPortugal = 1;
            
    //         // 首次救济金：如果 !player.hasBeenToPortugal（第一次发生）
    //         if (player.joinCoopRound === 0) {
    //           player.cocoa += 1;
    //           player.joinCoopRound = 1;
    //           G.logs.push(`玩家 ${player.id} 破产！失去 ${lostTimber} 木材 + ${lostCocoa} 可可，工人减少到 ${player.workers}，首次前往葡萄牙获得 1 可可救济金`);
    //         } else {
    //           G.logs.push(`玩家 ${player.id} 破产！失去 ${lostTimber} 木材 + ${lostCocoa} 可可，工人减少到 ${player.workers}，再次前往葡萄牙`);
    //         }
    //       }
    //     });
        
    //     // D. 检查游戏结束条件（在支付生活成本之后）
    //     // 规则书指出游戏在 Round 6 支付完生活费后结束
    //     if (G.round === 6 && events) {
    //       // 计算最终状态信息
    //       const survivors = G.players.filter((p) => !p.inPortugal || p.workers > 0).length;
    //       const finalTotalSnails = G.coreSnails + G.bufferSnails;
    //       const finalTotalTrees = G.coreTrees + G.bufferTrees;
          
    //       G.logs.push(`游戏结束！第 6 轮支付完成。存活玩家：${survivors}，最终生态：${finalTotalTrees} 棵树，${finalTotalSnails} 只蜗牛`);
          
    //       // 触发游戏结束
    //       events.endGame({
    //         round: G.round,
    //         survivors: survivors,
    //         finalTotalTrees: finalTotalTrees,
    //         finalTotalSnails: finalTotalSnails,
    //         playersInPortugal: G.players.filter((p) => p.inPortugal).length,
    //       });
    //     }
    //   },
    // },

    // 玩家行动阶段
    action: {
      start: true,
      onBegin: ({ G }: { G: G; ctx: Ctx }) => {
        // 重置阶段回合计数器
        G.phase = 'action';
        G.turnsInPhase = 0;
        // 重置所有地块的本回合种植标记（新回合开始时）
        G.cells.forEach(cell => {
          cell.farmedThisRound = false;
        });
        // 轮数增加
        G.round += 1;
      },
      turn: {
        order: {
          // 第一回合的起始玩家：第1轮由P0开始，第2轮由P1开始...
          first: ({ G, ctx }: { G: G; ctx: Ctx }) => (G.round - 1) % ctx.numPlayers,
          // 顺时针轮转
          next: ({ G, ctx }: { G: G; ctx: Ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
        },
        onBegin: ({ G, ctx }: { G: G; ctx: Ctx }) => {
          // 重置当前玩家的 actionsTaken
          const player = G.players.find((p) => p.id === parseInt(ctx.currentPlayer));
          if (player) {
            player.actionsTaken = 0;
          }
        },
        onEnd: ({ G }: { G: G; ctx: Ctx }) => {
          // 回合结束时，增加阶段回合计数器
          G.turnsInPhase += 1;
        },
      },
      endIf: ({ G, ctx }: { G: G; ctx: Ctx }) => {
        // 如果所有人都行动过一次，结束阶段
        return G.turnsInPhase >= ctx.numPlayers;
      },
      next: 'secret', // 下一阶段是 secret
      moves: {
        // 种可可：在指定地块上种植可可，立即收获
        farmCocoa: ({ G, ctx, events }: { G: G; ctx: Ctx; events?: any }, cellId: string) => {
          const currentPlayerId = ctx.currentPlayer;
          const player = G.players.find((p) => p.id === parseInt(currentPlayerId));
          if (!player) {
            return;
          }

          // 查找目标地块
          const cell = G.cells.find((c) => c.id === cellId);
          if (!cell) {
            return;
          }

          // 检查本回合是否已在该地块种植
          if (cell.farmedThisRound) {
            return; // 本回合已在该地块种植
          }

          // 前置检查：玩家只能在以下三种情况下耕种
          const canFarmOwn = cell.owner === currentPlayerId; // 耕种自己的地
          const canFarmNeighbor = cell.owner && isNeighbor(currentPlayerId, cell.owner); // 耕种邻居的地
          const isCoopMember = G.coopMembers.includes(currentPlayerId); // 发起者在合作社
          const targetIsCoopMember = cell.owner ? G.coopMembers.includes(cell.owner) : false; // 目标在合作社
          const canFarmCoop = isCoopMember && targetIsCoopMember; // 合作社特权（远程耕作）

          // 如果不满足上述任一条件，返回无效移动
          if (!canFarmOwn && !canFarmNeighbor && !canFarmCoop) {
            return;
          }

          // 执行逻辑：种植并立即收获可可
          const yieldAmount = getCocoaYield(cell.soilQuality);
          player.cocoa += yieldAmount;
          cell.farmedThisRound = true;
          player.actionsTaken += 1;

          // 记录日志
          if (canFarmOwn) {
            G.logs.push(`玩家 ${player.id+1} 在 ${cellId} 上种植可可，获得 ${yieldAmount} 个可可`);
          } else if (canFarmNeighbor) {
            G.logs.push(`玩家 ${player.id+1} 在邻居玩家 ${cell.owner} 的 ${cellId} 上种植可可，获得 ${yieldAmount} 个可可`);
          } else if (canFarmCoop) {
            G.logs.push(`玩家 ${player.id+1} 通过合作社特权在玩家 ${cell.owner} 的 ${cellId} 上种植可可，获得 ${yieldAmount} 个可可`);
          }

          // 检查是否应该结束回合
          if (player.actionsTaken >= player.workers && events) {
            events.endTurn();
          }
        },

        // 资源转让：玩家间的资源交易（带限制）
        transferResource: ({ G, ctx, events }: { G: G; ctx: Ctx; events?: any }, targetPlayerId: string, resource: 'COCOA' | 'TIMBER', amount: number) => {
          const currentPlayerId = ctx.currentPlayer;
          const player = G.players.find((p) => p.id === parseInt(currentPlayerId));
          if (!player) {
      return;
    }

          // 1. 严格的验证逻辑
          
          // 自我检查：targetPlayerId 不能是自己
          if (targetPlayerId === currentPlayerId) {
            return; // 无效移动
          }

          // 正数检查：amount 必须大于 0
          if (amount <= 0) {
            return; // 无效移动
          }

          // 反公社限制（Anti-Communism Limits）
          if (resource === 'COCOA' && amount > 3) {
            return; // 无效移动：COCOA 单次最多 3
          }
          if (resource === 'TIMBER' && amount > 1) {
            return; // 无效移动：TIMBER 单次最多 1
          }

          // 余额检查：当前玩家必须有足够的资源
          if (resource === 'COCOA' && player.cocoa < amount) {
            return; // 无效移动：余额不足
          }
          if (resource === 'TIMBER' && player.timber < amount) {
            return; // 无效移动：余额不足
          }

          // 查找目标玩家
          const targetPlayer = G.players.find((p) => p.id === parseInt(targetPlayerId));
          if (!targetPlayer) {
            return; // 无效移动：目标玩家不存在
          }

          // 2. 执行逻辑
          
          // 扣除发送者的资源
          if (resource === 'COCOA') {
            player.cocoa -= amount;
            targetPlayer.cocoa += amount;
          } else {
            player.timber -= amount;
            targetPlayer.timber += amount;
          }

          // 注意：此动作不增加 actionsTaken (Cost = 0)

          // 记录日志
          const resourceName = resource === 'COCOA' ? '可可' : '木材';
          G.logs.push(`玩家 ${player.id+1} 转让 ${amount} 个${resourceName}给玩家 ${targetPlayerId}`);
        },

        // 伐木（缓冲区）：减少 Buffer Trees，增加 Timber
        logBuffer: ({ G, ctx, events }: { G: G; ctx: Ctx; events?: any }) => {
          const player = G.players.find((p) => p.id === parseInt(ctx.currentPlayer));
          if (!player) {
            return;
          }

          // 检查缓冲区是否有树木
          if (G.bufferTrees > 0) {
            G.bufferTrees -= 1;
            player.timber += 1;
            player.actionsTaken += 1;
            G.logs.push(`玩家 ${player.id+1} 在缓冲区伐木，获得 1 个木材`);

            // 检查是否应该结束回合
            if (player.actionsTaken >= player.workers && events) {
              events.endTurn();
            }
          }
        },

        // 扩展农场：消耗 1 Timber + 1 Cocoa，将目标格子设为 FARM
        extendFarm: ({ G, ctx, events }: { G: G; ctx: Ctx; events?: any }, targetCellId: string) => {
          const player = G.players.find((p) => p.id === parseInt(ctx.currentPlayer));
          console.log('player', JSON.stringify(player));
          if (!player) {
            return;
          }
          G.logs.push(`玩家 ${player.id + 1} 尝试扩展农场到 ${targetCellId}`);

          // 检查玩家是否有足够的资源
          if (player.timber < 1 || player.cocoa < 1) {
            return;
          }

          // 查找目标格子
          const targetCell = G.cells.find((cell) => cell.id === targetCellId);
          if (!targetCell) {
            return;
          }

          // 检查格子是否为空（owner === null）
          if (targetCell.type !== 'EMPTY') {
            return;
          }

          // 扣除资源
          player.timber -= 1;
          player.cocoa -= 1;
          player.actionsTaken += 1;

          // 设置格子
          targetCell.owner = ctx.currentPlayer; // boardgame.io 使用字符串格式的玩家ID
          targetCell.type = 'FARM';
          targetCell.soilQuality = player.soilQuality;

          G.logs.push(`玩家 ${player.id+1} 扩展农场到 ${targetCellId}，消耗 1 木材 + 1 可可`);

          // 检查是否应该结束回合
          if (player.actionsTaken >= player.workers && events) {
            events.endTurn();
          }
        },

        // 放弃农场：移除 owner，变 EMPTY，获得 1 Timber
        abandonFarm: ({ G, ctx, events }: { G: G; ctx: Ctx; events?: any }, targetCellId: string) => {
          const player = G.players.find((p) => p.id === parseInt(ctx.currentPlayer));
          if (!player) {
            return;
          }

          // 查找目标格子
          const targetCell = G.cells.find((cell) => cell.id === targetCellId);
          if (!targetCell) {
            return;
          }

          // 检查格子是否属于当前玩家
          if (targetCell.owner !== ctx.currentPlayer) {
            return;
          }

          // 移除 owner，变 EMPTY
          targetCell.owner = null;
          targetCell.type = 'EMPTY';
          targetCell.soilQuality = 'BAD';

          // 获得 1 Timber
          player.timber += 1;
          player.actionsTaken += 1;
          G.logs.push(`玩家 ${player.id+1} 放弃农场 ${targetCellId}，获得 1 个木材`);

          // 检查是否应该结束回合
          if (player.actionsTaken >= player.workers && events) {
  events.endTurn();
          }
        },

        // 捕猎蜗牛：减少指定区域的 Snail，增加 2 Cocoa
        huntSnail: ({ G, ctx, events }: { G: G; ctx: Ctx; events?: any }, zone: 'CORE' | 'BUFFER') => {
          const player = G.players.find((p) => p.id === parseInt(ctx.currentPlayer));
          if (!player) {
            return;
          }

          // 根据区域减少蜗牛
          if (zone === 'BUFFER' && G.bufferSnails > 0) {
            G.bufferSnails -= 1;
            player.cocoa += 2;
            player.actionsTaken += 1;
            G.logs.push(`玩家 ${player.id+1} 在缓冲区捕猎蜗牛，获得 2 个可可`);

            // 检查是否应该结束回合
            if (player.actionsTaken >= player.workers && events) {
              events.endTurn();
            }
          } else if (zone === 'CORE' && G.coreSnails > 0) {
            G.coreSnails -= 1;
            player.cocoa += 2;
            player.actionsTaken += 1;
            G.logs.push(`玩家 ${player.id+1} 在核心区捕猎蜗牛，获得 2 个可可`);

            // 检查是否应该结束回合
            if (player.actionsTaken >= player.workers && events) {
              events.endTurn();
            }
          }
        },

        // 加入合作社：根据回合数加入合作社或申请列表
        joinCoop: ({ G, ctx, events }: { G: G; ctx: Ctx; events?: any }) => {
          const player = G.players.find((p) => p.id === parseInt(ctx.currentPlayer));
          if (!player) {
            return;
          }

          const playerIdStr = ctx.currentPlayer; // boardgame.io 使用字符串格式的玩家ID

          // 如果玩家已经在合作社成员中，则无效
          if (G.coopMembers.includes(playerIdStr)) {
            return;
          }

          // 如果已经在申请列表中，也无效
          if (G.coopApplicants.includes(playerIdStr)) {
            return;
          }

          // 根据回合数处理
          if (G.round === 2) {
            // Round 2: 直接加入合作社
            G.coopMembers.push(playerIdStr);
            player.actionsTaken += 1;
            G.logs.push(`玩家 ${player.id+1} 加入合作社`);
          } else if (G.round > 2) {
            // Round > 2: 加入申请列表
            G.coopApplicants.push(playerIdStr);
            player.actionsTaken += 1;
            G.logs.push(`玩家 ${player.id+1} 申请加入合作社`);
          }

          // 检查是否应该结束回合
          if (player.actionsTaken >= player.workers && events) {
            events.endTurn();
          }
        },

        // 赎回工人：从葡萄牙接回工人
        retrieveWorker: ({ G, ctx, events }: { G: G; ctx: Ctx; events?: any }) => {
          const player = G.players.find((p) => p.id === parseInt(ctx.currentPlayer));
          if (!player) {
            return;
          }

          // 验证逻辑：当前玩家必须处于"有工人在葡萄牙"的状态
          if (player.inPortugal === 0) {
            return; // 无效移动：不能赎回不存在的工人
          }

          // 执行逻辑：召回工人
          player.inPortugal = 0;
          player.workers += 1; // 恢复劳动力
          player.actionsTaken += 1; // 消耗行动点（接人这个动作本身消耗 1 个行动点）

          // 记录日志
          G.logs.push(`玩家 ${player.id+1} 从葡萄牙赎回了一个工人`);

          // 检查是否应该结束回合
          if (player.actionsTaken >= player.workers && events) {
            events.endTurn();
          }
        },
      },
    },

    // 秘密行动阶段
    secret: {
      onBegin: ({ G, ctx, events }: { G: G; ctx: Ctx; events?: any }) => {
        G.phase = 'secret';
        G.logs.push(`进入秘密行动阶段`);
        // 重置阶段回合计数器
        G.turnsInPhase = 0;
      },
      onEnd: ({ G, ctx, events }: { G: G; ctx: Ctx; events?: any }) => {
        G.turnsInPhase = 0;
      },
      turn: {
        // activePlayers: { all: 'secretStage' }, // 所有玩家同时行动
        order: TurnOrder.ONCE,
        endIf: ({ G, ctx }: { G: G; ctx: Ctx }) => {
          const player = G.players.find((p) => p.id === parseInt(ctx.currentPlayer));
          return player?.secretAction !== null;
        },
        onEnd: ({ G, ctx }: { G: G; ctx: Ctx }) => {
          G.turnsInPhase += 1;
        },
      },
      next: 'calculation', // 下一阶段是 calculation
      moves: {
        // 选择秘密行动：什么都不做
        doNothing: ({ G, ctx }: { G: G; ctx: Ctx; events?: any }) => {
          const player = G.players.find((p) => p.id === parseInt(ctx.currentPlayer));
          if (!player || player.secretAction !== null) {
            return;
          }

          player.secretAction = { type: 'DO_NOTHING' };
          G.logs.push(`玩家 ${player.id+1} 执行了秘密行动`);
        },

        // 选择秘密行动：偷窃
        steal: ({ G, ctx, events }: { G: G; ctx: Ctx; events?: any }, targetPlayerId: number, amount: number) => {
          const player = G.players.find((p) => p.id === parseInt(ctx.currentPlayer));
          const target = G.players.find((p) => p.id === targetPlayerId);
          
          if (!player || !target || player.secretAction !== null) {
            return;
          }

          // 只记录意图，不立即执行资源修改
          // 所有计算留给 calculation 阶段的 resolveSecretActions 函数
          player.secretAction = {
            type: 'STEAL',
            targetPlayerId: targetPlayerId,
            amount: amount,
          };
          
          // 模糊日志，不泄露偷了谁
          G.logs.push(`玩家 ${player.id+1} 执行了秘密行动`);
        },

        // 选择秘密行动：非法伐木
        illegalLog: ({ G, ctx, events }: { G: G; ctx: Ctx; events?: any }, zone: 'CORE' | 'BUFFER', amount: number) => {
          const player = G.players.find((p) => p.id === parseInt(ctx.currentPlayer));
          if (!player || player.secretAction !== null) {
            return;
          }

          // 只记录意图，不立即执行资源修改
          // 删除树木检查逻辑（意图总是可以记录的，实际能不能砍在结算阶段判断）
          // 所有计算留给 calculation 阶段的 resolveSecretActions 函数
          player.secretAction = {
            type: 'ILLEGAL_LOGGING',
            amount: amount,
          };
          
          // 模糊日志，不泄露具体行动
          G.logs.push(`玩家 ${player.id+1} 执行了秘密行动`);
        },
      },
      endIf: ({ G }: { G: G }) => {
        // 检查是否所有玩家都选择了秘密行动
        const allPlayersChose = G.players.every((p) => p.secretAction !== null);
        return allPlayersChose;
      },
    },

    // 结算阶段
    calculation: {
      next: 'action',
      onBegin: ({ G, ctx, events }: { G: G; ctx: Ctx; events?: any }) => {
        // 严格按照以下顺序执行：
        
        // 1. 结算黑夜阶段的秘密行动（非法伐木和偷窃）
        // 此时 G.coreTrees 可能因为非法伐木而减少
        resolveSecretActions(G);

        // 2. 计算蜗牛数量（基于再生前的树木，即非法伐木后的剩余树木）
        const newCoreSnails = calculateSnailPopulation(G.coreTrees, 'CORE');
        const newBufferSnails = calculateSnailPopulation(G.bufferTrees, 'BUFFER');
        
        G.coreSnails = newCoreSnails;
        G.bufferSnails = newBufferSnails;
        G.logs.push(`蜗牛数量更新：核心区 ${newCoreSnails} 只，缓冲区 ${newBufferSnails} 只`);

        // 3. 计算树木再生（基于剩余的树木）
        const newCoreTrees = calculateTreeRegrowth(G.coreTrees, 'CORE');
        const newBufferTrees = calculateTreeRegrowth(G.bufferTrees, 'BUFFER');
        
        const coreRegrowth = newCoreTrees - G.coreTrees;
        const bufferRegrowth = newBufferTrees - G.bufferTrees;
        
        G.coreTrees = newCoreTrees;
        G.bufferTrees = newBufferTrees;
        G.logs.push(`树木再生：核心区 +${coreRegrowth} 棵，缓冲区 +${bufferRegrowth} 棵`);

        // 4. 更新生活成本（根据总蜗牛数）
        const totalSnails = G.coreSnails + G.bufferSnails;
        const newLivingCost = calculateLivingCost(totalSnails);
        G.livingCost = newLivingCost;
        // 计算环境罚款：taxPenalty = livingCost.cocoa - 1（基础是1，所以额外的是 livingCost.cocoa - 1）
        G.taxPenalty = Math.max(0, newLivingCost.cocoa - 1);
        G.logs.push(`生活成本更新：${newLivingCost.timber} 木材 + ${newLivingCost.cocoa} 可可（每工人），环境罚款：${G.taxPenalty}`);

        // 4. 重置玩家状态
        // 注意：secretAction 已经在 resolveSecretActions 中清理了
        G.players.forEach((player) => {
          player.actionsTaken = 0;
        });

        // 5. 处理合作社申请：将所有申请者移入合作社成员列表
        if (G.coopApplicants.length > 0) {
          G.coopMembers.push(...G.coopApplicants);
          G.logs.push(`合作社投票通过：${G.coopApplicants.length} 名申请者加入合作社`);
          G.coopApplicants = []; // 清空申请列表
        }

        // 注意：round 的增加将在下一轮的 townHall 阶段处理

        // 6. 统一流转：无论第几轮，都进入下一轮的 townHall 阶段
        // （真正的游戏结束判定已经存在于 townHall 阶段中，这里不需要重复判定）
        events?.setPhase('action');
      },
      onEnd: ({ G }: { G: G; ctx: Ctx }) => {
        // 记录历史数据：在每轮结束时记录生态快照
        const totalSnails = G.coreSnails + G.bufferSnails;
        const playersInPortugal = G.players.filter((p) => p.inPortugal > 0).length;
        
        G.history.push({
          round: G.round,
          coreTrees: G.coreTrees,
          bufferTrees: G.bufferTrees,
          totalSnails: totalSnails,
          playersInPortugal: playersInPortugal,
        });
      },
    },

    // 游戏结束阶段
    gameOver: {
      // 游戏结束，不再有下一阶段
    },
  },

  // 玩家视图配置：剥离秘密信息
  // 注意：boardgame.io 的 PlayerView 需要通过其他方式配置
  // 这里先留空，可以在客户端配置中处理
};
