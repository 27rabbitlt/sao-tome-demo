// types.ts

// 游戏阶段枚举
export type GamePhase =
  | 'SETUP'           // 初始设置
  | 'townHall'        // 市政厅讨论 [cite: 70]
  | 'action'          // 玩家行动阶段 [cite: 72]
  | 'secret'           // 秘密行动阶段 (黑夜) [cite: 80]
  | 'calculation'     // 结算阶段 (生长、蜗牛、税收) [cite: 85]
  | 'gameOver';

// 地块接口
export interface LandCell {
  id: string;                    // 地块ID (例如: "cell-0", "cell-1", ...)
  type: 'FARM' | 'EMPTY';
  owner: string | null;          // 所有者玩家ID (字符串格式，例如: "0", "1", ...)
  soilQuality: 'GOOD' | 'MEDIUM' | 'BAD';
  farmedThisRound: boolean;      // 本回合是否已种植（防止重复种植）
}

// 玩家结构
export interface Player {
  id: number;
  name: string;       // 玩家名字
  isReady: boolean;   // 玩家是否准备好
  cocoa: number;      // 可可数量
  timber: number;     // 木材数量
  workers: number;    // 工人数量 (通常是2，第二回合后可能增加) [cite: 46, 213]
  ownedLands: string[]; // 玩家拥有的地块ID
  inPortugal: number; // 是否在葡萄牙 (用于锁定行动) [cite: 143]
  actionsTaken: number; // 当前回合已执行动作数
  secretAction: SecretAction | null; // 本回合选择的秘密行动
  joinCoop: boolean; // 是否申请加入合作社 (仅限 Round >= 2)
  joinCoopRound: number; // 加入合作社的回合数 (0 表示未加入)
  soilQuality: 'GOOD' | 'MEDIUM' | 'BAD'; // 土壤质量
}

// 秘密行动定义
// [cite: 83] DO_NOTHING
// [cite: 81] STEAL
// [cite: 82] ILLEGAL_LOGGING
export type SecretAction =
  | { type: 'DO_NOTHING' }
  | { type: 'STEAL'; targetPlayerId: number; amount: number }
  | { type: 'ILLEGAL_LOGGING'; amount: number };

// 全局游戏状态
export interface GameState {
  round: number;            // 当前回合 (1-5) [cite: 63]
  phase: GamePhase;         // 当前阶段
  
  // 生态数据 [cite: 32-35]
  coreTrees: number;        // 核心区树木 (Max 20)
  bufferTrees: number;      // 缓冲区树木 (Max 12)
  coreSnails: number;       // 核心区蜗牛
  bufferSnails: number;     // 缓冲区蜗牛
  
  players: Player[];        // 5名玩家的数组
  
  // 地块系统
  cells: LandCell[];        // 30个地块的数组
  
  // 合作社状态
  coopMembers: string[];    // 合作社成员列表 (玩家ID字符串数组)
  coopApplicants: string[]; // 合作社申请者列表 (玩家ID字符串数组)
  
  livingCost: {             // 生活成本 (动态变化)
    cocoa: number;
    timber: number;
  };                        // 初始为 1 timber + 1 cocoa/worker [cite: 194]
  
  taxPenalty: number;      // 环境罚款（由生态临界点触发的额外税收）
  
  turnsInPhase: number;     // 当前阶段已进行的回合数（用于轮换起始玩家）
  
  // 历史数据记录（用于生成复盘图表）
  history: Array<{
    round: number;
    coreTrees: number;
    bufferTrees: number;
    totalSnails: number;
    playersInPortugal: number;
  }>;
  
  logs: string[];           // 游戏日志 (用于显示发生了什么)
}