// game_logic.ts
// 引入你之前定义的数据结构
import type { GameState, Player, LandCell } from './core_data_structure';

/**
 * 初始化游戏状态
 * 基于规则书 Page 2 "Setup" 和 Page 6 "Paying Living Costs"
 */
export function initializeGame(): GameState {
    // 1. 初始化 5 名玩家数组
    // 规则参考:
    // - [cite: 36] P1 & P2: 优质土壤 (GOOD)
    // - [cite: 36] P3 & P4: 中等土壤 (MEDIUM)
    // - [cite: 36] P5: 劣质土壤 (BAD)
    // - [cite: 40] 所有玩家初始有 1 个 Timber
    // - [cite: 42] P1 & P2 初始有 3 个 Cocoa
    // - [cite: 43] P3 & P4 初始有 2 个 Cocoa
    // - [cite: 44] P5 初始有 1 个 Cocoa
    // - [cite: 213] 第一回合只有 2 个工人 (Wait, Round 2 is population boom, so start with standard workers. Implicitly 2 tokens based on Setup image B [cite: 46])
    // - 初始都不在葡萄牙 (inPortugal: false)
    
    const players: Player[] = [];
    
    // P0 & P1: 优质土壤 (GOOD)，初始有 3 个 Cocoa，1 个 Timber，2 个工人
    const defaultNames = ['玩家 1', '玩家 2', '玩家 3', '玩家 4', '玩家 5'];
    for (let i = 0; i < 5; i++) {
      players.push({
        id: i,
        name: defaultNames[i],
        isReady: false,
        cocoa: 3,
        timber: 1,
        workers: 2,
        inPortugal: 0,
        actionsTaken: 0,
        secretAction: null,
        joinCoop: false,
        joinCoopRound: 0,
        soilQuality: 'GOOD',
        ownedLands: [],
      });
    }
    
    players[2].cocoa = 2;
    players[3].cocoa = 2;
    players[4].cocoa = 1;
    players[2].soilQuality = 'MEDIUM';
    players[3].soilQuality = 'MEDIUM';
    players[4].soilQuality = 'BAD';

    // we give 5 farm lands to each player
    const landcells: LandCell[] = [];
    for (let playerIndex = 0; playerIndex < 5; playerIndex++) {
      
        landcells.push({
          id: `Farmland-1-of-Player-${playerIndex+1}`,
          type: 'FARM',
          owner: String(playerIndex), 
          soilQuality: players[playerIndex].soilQuality,
          farmedThisRound: false,
        });
        for (let i = 1; i < 5; i++) {
          landcells.push({
            id: `Farmland-${i+1}-of-Player-${playerIndex+1}`,
            type: 'EMPTY',
            owner: String(playerIndex), 
            soilQuality: players[playerIndex].soilQuality,
            farmedThisRound: false,
          });
        }
    }
      
  
    // 2. 初始化生态系统
    // 规则参考:
    // - [cite: 32] Core Trees 初始为 20
    // - [cite: 33] Buffer Trees 初始为 12
    // - [cite: 35] Core Snails 初始为 10
    // - [cite: 35] Buffer Snails 初始为 4
    
    
    // 4. 初始化全局状态
    // - Round: 1
    // - Phase: TOWN_HALL (根据 [cite: 66-70], 每一轮开始先付税，然后是 Town Hall。但在游戏刚开始setup之后，通常直接进入 Round 1 的流程)
    // - Living Cost: 初始为 1 timber + 1 cocoa (每工人) [cite: 194]
    
    // 5. 返回完整的 GameState 对象
    return {
      round: 0,
      phase: 'registration',
      coreTrees: 20,
      bufferTrees: 12,
      coreSnails: 10,
      bufferSnails: 4,
      players: players,
      cells: landcells,
      coopMembers: [],
      coopApplicants: [],
      livingCost: {
        cocoa: 1,
        timber: 1,
      },
      taxPenalty: 0,
      turnsInPhase: 0,
      history: [],
      logs: [],
    };
  }
  
  /**
   * 辅助函数：根据土壤质量获取农田产出
   * 规则参考[cite: 103]:
   * - GOOD: 3 cocoa
   * - MEDIUM: 2 cocoa
   * - BAD: 1 cocoa
   */
  export function getCocoaYield(soilQuality: 'GOOD' | 'MEDIUM' | 'BAD'): number {
    switch (soilQuality) {
      case 'GOOD':
        return 3;
      case 'MEDIUM':
        return 2;
      case 'BAD':
        return 1;
    }
  }




  // game_logic.ts (继续添加)

// ==========================================
// 生态系统逻辑 (Nature Queen & Daytime Queen)
// ==========================================

/**
 * 1. 计算蜗牛数量 (根据当前树木数量)
 * 规则参考 Page 14 "Queen of Daytime table" [cite: 502, 503]
 * 逻辑：
 * - 蜗牛的变化发生在树木再生之前 。
 * - 核心区 (Core): 需要2棵树供养1只蜗牛 (Math.floor(trees / 2))。
 * - 缓冲区 (Buffer): 需要3棵树供养1只蜗牛 (Math.floor(trees / 3))。
 * - 缓冲区最大蜗牛数是 4 (对应12棵树)，核心区最大是 10 (对应20棵树)。
 */
export function calculateSnailPopulation(snails: number, trees: number, zone: 'CORE' | 'BUFFER'): number {
    
    if (zone === 'CORE') {
      // 核心区：需要2棵树供养1只蜗牛，最大10只
      snails = Math.min(snails, Math.floor(trees / 2));
      return Math.min(snails, 10);
    } else {
      // 缓冲区：需要3棵树供养1只蜗牛，最大4只
      snails = Math.min(snails, Math.floor(trees / 3));
      return Math.min(snails, 4);
    }
  }
  
  /**
   * 2. 计算树木再生 (Tree Regrowth)
   * 规则参考 Page 7 "Reforestation" & Page 13 "Queen of Nature table" [cite: 211, 492]
   * 逻辑：
   * - 核心区 (Core): 再生剩余量的 20% (向下取整)，上限 20。
   * - 缓冲区 (Buffer): 再生剩余量的 15% (向下取整)，上限 12。
   * - 注意：输入是“当前树木”，输出是“下一轮的树木总数”。
   * - 公式提示: nextTrees = currentTrees + Math.floor(currentTrees * rate)
   */
  export function calculateTreeRegrowth(currentTrees: number, zone: 'CORE' | 'BUFFER'): number {
    let rate: number;
    let maxTrees: number;
    
    if (zone === 'CORE') {
      // 核心区：再生剩余量的 20%，上限 20
      rate = 0.2;
      maxTrees = 20;
    } else {
      // 缓冲区：再生剩余量的 15%，上限 12
      rate = 0.15;
      maxTrees = 12;
    }
    
    // 计算再生量（向下取整）
    const regrowth = Math.floor(currentTrees * rate);
    // 计算下一轮的树木总数
    const nextTrees = currentTrees + regrowth;
    // 应用上限
    return Math.min(nextTrees, maxTrees);
  }
  
  /**
   * 3. 检查临界点并更新生活成本 (Tipping Points & Tax)
   * 规则参考 Page 7 "Tipping points" [cite: 222-225, 507]
   * 逻辑：
   * - 基础税收: 1 Timber + 1 Cocoa (每工人) [cite: 194]
   * - 临界点 1: 总蜗牛数 <= 11 -> 税收 +1 Cocoa
   * - 临界点 2: 总蜗牛数 <= 7  -> 税收再 +1 Cocoa (共 +2)
   * - 临界点 3: 总蜗牛数 <= 4  -> 税收再 +1 Cocoa (共 +3)
   * 输入: 核心区蜗牛 + 缓冲区蜗牛
   * 输出: 新的 LivingCost 对象
   */
  export function calculateLivingCost(totalSnails: number): { timber: number, cocoa: number } {
    // 基础成本
    let timberCost = 1;
    let cocoaCost = 1;
  
    // // 根据总蜗牛数检查临界点，累加 cocoaCost
    // // 注意：从最严格的条件开始检查（累积效应）
    // if (totalSnails <= 4) {
    //   // 临界点 3: 总蜗牛数 <= 4 -> 税收 +3 Cocoa (共 +3)
    //   cocoaCost += 3;
    // } else if (totalSnails <= 7) {
    //   // 临界点 2: 总蜗牛数 <= 7 -> 税收 +2 Cocoa (共 +2)
    //   cocoaCost += 2;
    // } else if (totalSnails <= 11) {
    //   // 临界点 1: 总蜗牛数 <= 11 -> 税收 +1 Cocoa
    //   cocoaCost += 1;
    // }
    // 如果 totalSnails > 11，只使用基础成本
    
    return { timber: timberCost, cocoa: cocoaCost };
  }

  /**
   * 结算黑夜阶段的秘密行动
   * 规则参考：先结算非法伐木（和罚款），然后再结算偷窃
   * 
   * 第一步：结算非法伐木 (Illegal Logging)
   * - 每次砍伐被抓概率 = 5 / 当前核心区树木总数
   * - 如果被抓：罚款 2 Cocoa，获得 0 Timber
   * - 如果没被抓：减少树木，增加 Timber
   * 
   * 第二步：结算偷窃 (Stealing)
   * - 统计每个目标被偷次数
   * - 如果目标被偷次数 > 1，则所有小偷都失败（互相发现）
   * - 如果目标被偷次数 == 1，执行偷窃转账
   * 
   * 第三步：清理 secretAction
   */
  export function resolveSecretActions(G: GameState): void {
    // ==========================================
    // 第一步：结算非法伐木 (Illegal Logging)
    // ==========================================
    G.players.forEach((player) => {
      if (player.secretAction?.type === 'ILLEGAL_LOGGING') {
        const amount = player.secretAction.amount; // 1-3
        let caught = false;
        let successfulCuts = 0;

        // 进行 amount 次循环模拟
        for (let i = 0; i < amount; i++) {
          // 计算被抓概率：catchChance = 5 / G.coreTrees
          // 如果树 < 5，则概率为 1
          const catchChance = G.coreTrees < 5 ? 1 : 5 / G.coreTrees;
          const isCaught = Math.random() < catchChance;

          if (isCaught) {
            // 如果被抓，罚款 2 Cocoa，获得 0 Timber，循环终止
            caught = true;
            player.cocoa = Math.max(0, player.cocoa - 2); // 确保不会变成负数
            G.logs.push(`玩家 ${player.id+1} 非法伐木时被护林员抓住，罚款 2 可可`);
            break; // 循环终止
          } else {
            // 如果没有被抓，记录成功砍伐
            successfulCuts++;
          }
        }

        if (!caught && successfulCuts > 0) {
          // 如果没被抓，减少树木，增加 Timber
          G.coreTrees = Math.max(0, G.coreTrees - successfulCuts);
          player.timber += successfulCuts;
          // G.logs.push(`玩家 ${player.id+1} 非法伐木 ${successfulCuts} 棵，获得 ${successfulCuts} 个木材`);
        }
      }
    });

    // ==========================================
    // 第二步：结算偷窃 (Stealing)
    // ==========================================
    // 创建 Map 统计每个 targetPlayerId 被多少人作为目标
    const stealTargetCount = new Map<number, number>();
    
    // 第一遍遍历：统计每个目标被偷次数
    G.players.forEach((player) => {
      if (player.secretAction?.type === 'STEAL') {
        const targetId = player.secretAction.targetPlayerId;
        const currentCount = stealTargetCount.get(targetId) || 0;
        stealTargetCount.set(targetId, currentCount + 1);
      }
    });

    // 第二遍遍历：执行偷窃逻辑
    G.players.forEach((thief) => {
      if (thief.secretAction?.type === 'STEAL') {
        const targetId = thief.secretAction.targetPlayerId;
        const amount = thief.secretAction.amount;
        const target = G.players.find((p) => p.id === targetId);
        
        if (!target) {
          return; // 目标不存在
        }

        const stealCount = stealTargetCount.get(targetId) || 0;

        // 冲突判定：如果目标被偷次数 > 1，则偷窃失败（互相发现）
        if (stealCount > 1) {
          // 所有针对该受害者的"小偷"都空手而归
          G.logs.push(`有多人同时偷窃某玩家，互相发现，偷窃失败`);
          // thief 获得 0（不需要操作，因为已经是 0）
        } else {
          // 成功偷窃：如果目标被偷次数 == 1
          // 计算实际偷窃量：actualSteal = Math.min(amount, target.cocoa)
          const actualSteal = Math.min(amount, target.cocoa);
          
          if (actualSteal > 0) {
            // 执行转账
            target.cocoa -= actualSteal;
            thief.cocoa += actualSteal;
            // G.logs.push(`玩家 ${thief.id+1} 从玩家 ${targetId+1} 偷窃了 ${actualSteal} 个可可`);
          } else {
            // G.logs.push(`玩家 ${thief.id+1} 试图偷窃玩家 ${targetId+1}，但目标没有可可`);
          }
        }
      }
    });

    // ==========================================
    // 第三步：清理 secretAction
    // ==========================================
    G.players.forEach((player) => {
      player.secretAction = null;
    });
  }