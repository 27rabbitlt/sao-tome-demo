/**
 * 辅助函数：判断两个玩家是否为邻居
 * 地图上的玩家分布是线性的（P0 - P1 - P2 - P3 - P4）
 * 由于岛屿是 C 字形，P0 和 P4 不是邻居
 * @param id1 玩家ID字符串（例如："0", "1"）
 * @param id2 玩家ID字符串（例如："0", "1"）
 * @returns 如果两个玩家是邻居返回 true，否则返回 false
 */
export function isNeighbor(id1: string, id2: string): boolean {
  const n1 = parseInt(id1, 10);
  const n2 = parseInt(id2, 10);
  
  // 仅当 Math.abs(n1 - n2) === 1 时返回 true
  // 这样确保了 0 和 4 不互为邻居
  return Math.abs(n1 - n2) === 1;
}