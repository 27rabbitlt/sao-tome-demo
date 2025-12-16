// São Tomé Island Farmers - Player Panel Component
import type { GameState, Player, SecretAction } from './core_data_structure';

interface PlayerPanelProps {
  player: Player & { name?: string };
  isCurrentTurn: boolean;  // Is it this player's turn?
  isMyPlayer: boolean;     // Is this the player I control?
  canAct: boolean;         // Can I perform actions right now?
  gameState: GameState;
  moves: {
    farmCocoa?: (targetPlayerId: string) => void;
    transferResource?: (targetPlayerId: string, resource: 'COCOA' | 'TIMBER', amount: number) => void;
    logBuffer?: () => void;
    extendFarm?: (targetCellId: string) => void;
    abandonFarm?: (targetCellId: string) => void;
    huntSnail?: (zone: 'CORE' | 'BUFFER') => void;
    joinCoop?: () => void;
    retrieveWorker?: () => void;
    doNothing?: () => void;
    steal?: (targetPlayerId: number, amount: number) => void;
    illegalLog?: (zone: 'CORE' | 'BUFFER', amount: number) => void;
  };
  allPlayers: (Player & { name?: string })[];
}

function LandCellDisplay({ 
  cell, 
  canAct,
  isActionPhase,
  hasActionsLeft,
  onExtend,
  onAbandon,
  hasResources,
  playerId,
}: { 
  cell: GameState['cells'][0];
  canAct: boolean;
  isActionPhase: boolean;
  hasActionsLeft: boolean;
  onExtend: () => void;
  onAbandon: () => void;
  hasResources: boolean;
  playerId: number;
}) {
  const isOwned = cell.owner === String(playerId);
  const isEmpty = cell.type === 'EMPTY';

  return (
    <div className={`land-cell ${cell.type} ${isOwned ? 'owned' : ''}`}>
      <div className="cell-header">
        <span className="cell-id">{cell.id}</span>
        <span className="cell-type">
          {cell.type === 'FARM' && '🌾'}
          {cell.type === 'EMPTY' && '🏜️'}
        </span>
      </div>
      <div className="cell-info">
        {cell.type === 'FARM' && (
          <>
            <div className="soil-quality">
              土壤: {cell.soilQuality === 'GOOD' ? '⭐优质' : cell.soilQuality === 'MEDIUM' ? '⭐中等' : '⭐劣质'}
            </div>
            <div className="cell-owner">所有者: 玩家 {cell.owner}</div>
          </>
        )}
        {isEmpty && canAct && isActionPhase && hasActionsLeft && hasResources && (
          <button onClick={onExtend} className="action-btn extend">
            🌾 扩展农场 (1木材+1可可)
          </button>
        )}
        {isOwned && canAct && isActionPhase && hasActionsLeft && (
          <button onClick={onAbandon} className="action-btn abandon">
            🏜️ 放弃农场 (+1木材)
          </button>
        )}
      </div>
    </div>
  );
}

function SecretActionPanel({ 
  player,
  moves,
  allPlayers,
  canAct,
}: {
  player: Player & { name?: string };
  moves: PlayerPanelProps['moves'];
  allPlayers: (Player & { name?: string })[];
  canAct: boolean;
}) {
  const hasSelectedAction = !!player.secretAction;

  if (hasSelectedAction) {
    return (
      <div className="secret-action-panel selected">
        <h4>🌙 秘密行动已选择</h4>
        <p className="action-hint">等待其他玩家...</p>
      </div>
    );
  }

  if (!canAct) {
    return (
      <div className="secret-action-panel waiting">
        <h4>🌙 等待轮到你...</h4>
      </div>
    );
  }

  return (
    <div className="secret-action-panel">
      <h4>🌙 选择你的秘密行动</h4>
      <div className="secret-actions-grid">
        <button 
          className="secret-action-btn do-nothing"
          onClick={() => moves.doNothing?.()}
        >
          😴 什么都不做<br/>
          <small>安全无风险</small>
        </button>
        
        <button 
          className="secret-action-btn illegal-log"
          onClick={() => moves.illegalLog?.('CORE', 1)}
        >
          🌲 非法伐木 (1棵)<br/>
          <small>有风险，可能被抓</small>
        </button>
        
        <button 
          className="secret-action-btn illegal-log"
          onClick={() => moves.illegalLog?.('CORE', 2)}
        >
          🌲 非法伐木 (2棵)<br/>
          <small>有风险，可能被抓</small>
        </button>
        
        <button 
          className="secret-action-btn illegal-log"
          onClick={() => moves.illegalLog?.('CORE', 3)}
        >
          🌲 非法伐木 (3棵)<br/>
          <small>有风险，可能被抓</small>
        </button>
      </div>

      {allPlayers.length > 1 && (
        <>
          <h5>🎯 偷窃其他玩家</h5>
          <div className="steal-actions">
            {allPlayers
              .filter(target => target.id !== player.id)
              .map(target => (
                <div key={target.id} className="target-player">
                  <span className="target-name">玩家 {target.id}</span>
                  <button 
                    className="secret-action-btn steal small"
                    onClick={() => moves.steal?.(target.id, 1)}
                  >
                    偷 1 可可
                  </button>
                  <button 
                    className="secret-action-btn steal small"
                    onClick={() => moves.steal?.(target.id, 2)}
                  >
                    偷 2 可可
                  </button>
                  <button 
                    className="secret-action-btn steal small"
                    onClick={() => moves.steal?.(target.id, 3)}
                  >
                    偷 3 可可
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

export function PlayerPanel({ 
  player, 
  isCurrentTurn,
  isMyPlayer,
  canAct,
  gameState,
  moves,
  allPlayers,
}: PlayerPanelProps) {
  // Safety checks
  if (!player || !gameState) {
    return <div>加载中...</div>;
  }

  const isActionPhase = gameState.phase === 'action';
  const isSecretPhase = gameState.phase === 'secret';
  const hasActionsLeft = (player.actionsTaken || 0) < (player.workers || 0);
  const remainingActions = (player.workers || 0) - (player.actionsTaken || 0);
  const hasResources = (player.timber || 0) >= 1 && (player.cocoa || 0) >= 1;
  const isInCoop = (gameState.coopMembers || []).includes(String(player.id));

  // Get player's owned cells (with safety check)
  const cells = gameState.cells || [];
  const playerCells = cells.filter(cell => cell.owner === String(player.id));
  const emptyCells = cells.filter(cell => cell.type === 'EMPTY' && cell.owner === null);

  return (
    <div className={`player-panel ${isCurrentTurn ? 'current-turn' : ''} ${isMyPlayer ? 'my-player' : ''} ${player.inPortugal ? 'in-portugal' : ''}`}>
      <div className="player-header">
        <h3>
          {isCurrentTurn && '▶ '}
          {player.name || `玩家 ${player.id + 1}`}
          {isMyPlayer && ' (你)'}
          {isCurrentTurn && ' (当前回合)'}
          {player.inPortugal > 0 && ' 🇵🇹 在葡萄牙'}
        </h3>
        {isActionPhase && (
          <span className="action-points">
            ⚡ {remainingActions}/{player.workers} 剩余行动
          </span>
        )}
        {isInCoop && (
          <span className="coop-badge">🤝 合作社成员</span>
        )}
      </div>

      <div className="player-resources">
        <div className="resource cocoa">
          <span className="resource-icon">🍫</span>
          <span className="resource-value">{player.cocoa}</span>
          <span className="resource-label">可可</span>
        </div>
        <div className="resource timber">
          <span className="resource-icon">🪵</span>
          <span className="resource-value">{player.timber}</span>
          <span className="resource-label">木材</span>
        </div>
        <div className="resource workers">
          <span className="resource-icon">👷</span>
          <span className="resource-value">{player.workers}</span>
          <span className="resource-label">工人</span>
        </div>
        <div className="resource soil">
          <span className="resource-icon">🌾</span>
          <span className="resource-value">
            {player.soilQuality === 'GOOD' ? '优质' : player.soilQuality === 'MEDIUM' ? '中等' : '劣质'}
          </span>
          <span className="resource-label">土壤</span>
        </div>
      </div>

      <div className="living-cost">
        生活成本: <span className="cost-value">{gameState.livingCost.timber} 木材 + {gameState.livingCost.cocoa} 可可/工人</span>
        {gameState.taxPenalty > 0 && (
          <span className="tax-penalty"> + {gameState.taxPenalty} 环境罚款</span>
        )}
      </div>

      {/* Debug info
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '12px', color: '#666', padding: '10px', background: '#f0f0f0', margin: '10px 0' }}>
          <div>Phase: {gameState.phase}</div>
          <div>isActionPhase: {String(isActionPhase)}</div>
          <div>canAct: {String(canAct)}</div>
          <div>hasActionsLeft: {String(hasActionsLeft)}</div>
          <div>isCurrentTurn: {String(isCurrentTurn)}</div>
          <div>isMyPlayer: {String(isMyPlayer)}</div>
          <div>actionsTaken: {player.actionsTaken || 0} / workers: {player.workers || 0}</div>
        </div>
      )} */}

      {/* Action Phase Actions */}
      {isActionPhase && (
        <div className="action-phase-actions">
          {!canAct && (
            <div style={{ padding: '10px', background: '#fff3cd', margin: '10px 0' }}>
              {!isCurrentTurn ? '等待你的回合...' : '无法执行行动'}
            </div>
          )}
          {canAct && !hasActionsLeft && (
            <div style={{ padding: '10px', background: '#f8d7da', margin: '10px 0' }}>
              行动点已用完，请等待回合结束
            </div>
          )}
          {canAct && hasActionsLeft && (
            <>
              <h4>可用行动</h4>
              <div className="actions-grid">
            {/* Farm Cocoa */}
            <div className="action-group">
              <h5>🌾 种可可</h5>
              <div className="target-players">
                {allPlayers.map(target => {
                  const canFarmOwn = target.id === player.id;
                  const canFarmNeighbor = Math.abs(target.id - player.id) === 1;
                  const canFarmCoop = isInCoop && gameState.coopMembers.includes(String(target.id));
                  const canFarm = canFarmOwn || canFarmNeighbor || canFarmCoop;
                  
                  if (!canFarm) return null;
                  
                  return (
                    <button
                      key={target.id}
                      className="action-btn farm"
                      onClick={() => moves.farmCocoa?.(String(target.id))}
                    >
                      在玩家 {target.id} 的土地上种可可
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Log Buffer */}
            {gameState.bufferTrees > 0 && (
              <button
                className="action-btn log"
                onClick={() => moves.logBuffer?.()}
              >
                🪓 缓冲区伐木 (+1木材)
              </button>
            )}

            {/* Hunt Snail */}
            {(gameState.coreSnails > 0 || gameState.bufferSnails > 0) && (
              <div className="action-group">
                <h5>🐌 捕猎蜗牛 (+2可可)</h5>
                {gameState.coreSnails > 0 && (
                  <button
                    className="action-btn hunt"
                    onClick={() => moves.huntSnail?.('CORE')}
                  >
                    核心区
                  </button>
                )}
                {gameState.bufferSnails > 0 && (
                  <button
                    className="action-btn hunt"
                    onClick={() => moves.huntSnail?.('BUFFER')}
                  >
                    缓冲区
                  </button>
                )}
              </div>
            )}

            {/* Join Coop */}
            {gameState.round >= 2 && !isInCoop && !gameState.coopApplicants.includes(String(player.id)) && (
              <button
                className="action-btn coop"
                onClick={() => moves.joinCoop?.()}
              >
                🤝 {gameState.round === 2 ? '加入合作社' : '申请加入合作社'}
              </button>
            )}

            {/* Retrieve Worker */}
            {player.inPortugal && (
              <button
                className="action-btn retrieve"
                onClick={() => moves.retrieveWorker?.()}
              >
                👷 从葡萄牙赎回工人
              </button>
            )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Town Hall Phase Info */}
      {gameState.phase === 'townHall' && (
        <div className="town-hall-info" style={{ padding: '15px', background: '#e7f3ff', margin: '10px 0', borderRadius: '5px' }}>
          <h4>🏛️ 市政厅讨论阶段</h4>
          <p>正在处理生活成本支付和特殊事件...</p>
          <p>请稍候，即将进入行动阶段</p>
        </div>
      )}

      {/* Calculation Phase Info */}
      {gameState.phase === 'calculation' && (
        <div className="calculation-info" style={{ padding: '15px', background: '#fff3cd', margin: '10px 0', borderRadius: '5px' }}>
          <h4>📊 结算阶段</h4>
          <p>正在计算生态变化和资源更新...</p>
        </div>
      )}

      {/* Player's Cells */}
      <div className="player-cells">
        <h4>🏝️ 拥有的地块 ({playerCells.length})</h4>
        <div className="cells-grid">
          {playerCells.map(cell => (
            <LandCellDisplay
              key={cell.id}
              cell={cell}
              canAct={canAct}
              isActionPhase={isActionPhase}
              hasActionsLeft={hasActionsLeft}
              onExtend={() => {}}
              onAbandon={() => moves.abandonFarm?.(cell.id)}
              hasResources={hasResources}
              playerId={player.id}
            />
          ))}
          {emptyCells.slice(0, 3).map(cell => (
            <LandCellDisplay
              key={cell.id}
              cell={cell}
              canAct={canAct}
              isActionPhase={isActionPhase}
              hasActionsLeft={hasActionsLeft}
              onExtend={() => moves.extendFarm?.(cell.id)}
              onAbandon={() => {}}
              hasResources={hasResources}
              playerId={player.id}
            />
          ))}
        </div>
      </div>

      {/* Secret Phase: Action Selection */}
      {isSecretPhase && isMyPlayer && (
        <SecretActionPanel
          player={player}
          moves={moves}
          allPlayers={allPlayers}
          canAct={canAct}
        />
      )}

      {/* Secret Phase: Waiting indicator for other players */}
      {isSecretPhase && !isMyPlayer && (
        <div className="secret-status-indicator">
          {player.secretAction ? (
            <span className="status ready">✓ 已选择行动</span>
          ) : (
            <span className="status waiting">⏳ 等待选择...</span>
          )}
        </div>
      )}
    </div>
  );
}
