// São Tomé Island Farmers - Main Board Component
import { useEffect } from 'react';
import type { BoardProps } from 'boardgame.io/react';
import type { GameState } from './core_data_structure';
import { PlayerPanel } from './PlayerPanel';
import './game.css';

interface SaoTomeBoardProps extends BoardProps<GameState> {
  hotseatMode?: boolean;
  playerNames?: string[];
}

function EcosystemDisplay({ G }: { G: GameState }) {
  const totalTrees = G.coreTrees + G.bufferTrees;
  const totalSnails = G.coreSnails + G.bufferSnails;
  const maxTrees = 20 + 12; // Core max + Buffer max

  return (
    <div className="ecosystem-display">
      <div className="ecosystem-label">🌍 生态系统状态</div>
      <div className="ecosystem-stats">
        <div className="stat-item">
          <span className="stat-label">🌲 核心区树木</span>
          <span className="stat-value">{G.coreTrees}/20</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">🌳 缓冲区树木</span>
          <span className="stat-value">{G.bufferTrees}/12</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">🐌 核心区蜗牛</span>
          <span className="stat-value">{G.coreSnails}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">🐌 缓冲区蜗牛</span>
          <span className="stat-value">{G.bufferSnails}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">💰 生活成本</span>
          <span className="stat-value">{G.livingCost.timber} 木材 + {G.livingCost.cocoa} 可可/工人</span>
        </div>
        {G.taxPenalty > 0 && (
          <div className="stat-item warning">
            <span className="stat-label">⚠️ 环境罚款</span>
            <span className="stat-value">+{G.taxPenalty} 可可</span>
          </div>
        )}
      </div>
    </div>
  );
}

function GameLog({ logs }: { logs: string[] }) {
  const recentLogs = logs.slice(-15).reverse();

  return (
    <div className="game-log">
      <h3>📜 游戏日志</h3>
      <div className="logs-list">
        {recentLogs.length === 0 ? (
          <div className="log-item">游戏刚刚开始...</div>
        ) : (
          recentLogs.map((log, i) => (
            <div key={i} className="log-item">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PortugalFamiliesPanel({ players }: { players: GameState['players'] }) {
  // 统计每个家庭在葡萄牙的人数
  const familiesInPortugal = players
    .filter((p) => p.inPortugal > 0)
    .map((p) => ({
      playerId: p.id,
      playerName: p.name || `玩家 ${p.id + 1}`,
      workersInPortugal: p.inPortugal,
    }));

  if (familiesInPortugal.length === 0) {
    return (
      <div className="portugal-panel">
        <h3>🇵🇹 葡萄牙家庭</h3>
        <div className="portugal-families-list">
          <div className="portugal-family-item empty">
            <span>目前没有家庭在葡萄牙</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portugal-panel">
      <h3>🇵🇹 葡萄牙家庭</h3>
      <div className="portugal-families-list">
        {familiesInPortugal.map((family) => (
          <div key={family.playerId} className="portugal-family-item">
            <span className="family-name">{family.playerName}</span>
            <span className="family-workers">
              {family.workersInPortugal} {family.workersInPortugal === 1 ? '人' : '人'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DebriefingPanel({ G }: { G: GameState }) {
  // Find initial state (round 0 or first entry)
  const initialEntry = G.history.find(h => h.round === 0) || (G.history.length > 0 ? G.history[0] : null);
  const initialTrees = initialEntry ? initialEntry.coreTrees + initialEntry.bufferTrees : (G.coreTrees + G.bufferTrees);
  const finalTrees = G.coreTrees + G.bufferTrees;
  const treeChange = finalTrees - initialTrees;

  const initialSnails = initialEntry ? initialEntry.totalSnails : (G.coreSnails + G.bufferSnails);
  const finalSnails = G.coreSnails + G.bufferSnails;
  const snailChange = finalSnails - initialSnails;
  
  // Filter out round 0 from timeline display
  const timelineHistory = G.history.filter(h => h.round > 0);

  return (
    <div className="debriefing-container">
      <header className="debriefing-header">
        <h1>📊 游戏总结</h1>
        <p className="debriefing-subtitle">Game Debriefing</p>
      </header>

      <div className="debriefing-content">
        {/* Ecosystem Changes */}
        <section className="debriefing-section">
          <h2>🌍 生态系统变化</h2>
          
          <div className="ecosystem-changes">
            <div className="change-item">
              <div className="change-header">
                <span className="change-icon">🌲</span>
                <span className="change-label">树木总数</span>
              </div>
              <div className="change-values">
                <span className="change-initial">{initialTrees}</span>
                <span className="change-arrow">→</span>
                <span className={`change-final ${treeChange >= 0 ? 'positive' : 'negative'}`}>
                  {finalTrees}
                </span>
                <span className={`change-delta ${treeChange >= 0 ? 'positive' : 'negative'}`}>
                  ({treeChange >= 0 ? '+' : ''}{treeChange})
                </span>
              </div>
            </div>

            <div className="change-item">
              <div className="change-header">
                <span className="change-icon">🐌</span>
                <span className="change-label">蜗牛总数</span>
              </div>
              <div className="change-values">
                <span className="change-initial">{initialSnails}</span>
                <span className="change-arrow">→</span>
                <span className={`change-final ${snailChange >= 0 ? 'positive' : 'negative'}`}>
                  {finalSnails}
                </span>
                <span className={`change-delta ${snailChange >= 0 ? 'positive' : 'negative'}`}>
                  ({snailChange >= 0 ? '+' : ''}{snailChange})
                </span>
              </div>
            </div>
          </div>

          {/* History Timeline */}
          {(timelineHistory.length > 0 || initialEntry) && (
            <div className="history-timeline">
              <h3>📈 历史变化</h3>
              <div className="timeline-table">
                <div className="timeline-header">
                  <span>回合</span>
                  <span>核心树木</span>
                  <span>缓冲树木</span>
                  <span>总树木</span>
                  <span>总蜗牛</span>
                  <span>在葡萄牙</span>
                </div>
                {/* Initial state */}
                {initialEntry && (
                  <div className="timeline-row initial">
                    <span className="timeline-round">初始</span>
                    <span>{initialEntry.coreTrees}</span>
                    <span>{initialEntry.bufferTrees}</span>
                    <span className="timeline-total">{initialEntry.coreTrees + initialEntry.bufferTrees}</span>
                    <span>{initialEntry.totalSnails}</span>
                    <span>{initialEntry.playersInPortugal} 人</span>
                  </div>
                )}
                {/* Round history */}
                {timelineHistory.map((entry, index) => (
                  <div key={index} className="timeline-row">
                    <span className="timeline-round">第 {entry.round} 轮</span>
                    <span>{entry.coreTrees}</span>
                    <span>{entry.bufferTrees}</span>
                    <span className="timeline-total">{entry.coreTrees + entry.bufferTrees}</span>
                    <span>{entry.totalSnails}</span>
                    <span>{entry.playersInPortugal} 人</span>
                  </div>
                ))}
                {/* Final state */}
                <div className="timeline-row final">
                  <span className="timeline-round">最终</span>
                  <span>{G.coreTrees}</span>
                  <span>{G.bufferTrees}</span>
                  <span className="timeline-total">{G.coreTrees + G.bufferTrees}</span>
                  <span>{G.coreSnails + G.bufferSnails}</span>
                  <span>{G.players.filter(p => p.inPortugal > 0).length} 人</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Game Logs */}
        <section className="debriefing-section">
          <h2>📝 完整游戏日志</h2>
          <div className="debriefing-logs">
            {G.logs.length > 0 ? (
              G.logs.map((log, index) => (
                <div key={index} className="debriefing-log-entry">
                  {log}
                </div>
              ))
            ) : (
              <div className="debriefing-log-entry empty">暂无日志</div>
            )}
          </div>
        </section>

        {/* Final Player Status */}
        <section className="debriefing-section">
          <h2>👥 最终玩家状态</h2>
          <div className="final-players">
            {G.players.map((player) => (
              <div key={player.id} className="final-player-card">
                <div className="final-player-header">
                  <span className="final-player-name">{player.name || `玩家 ${player.id + 1}`}</span>
                  {player.inPortugal > 0 && (
                    <span className="final-player-status">🇵🇹 在葡萄牙 ({player.inPortugal} 人)</span>
                  )}
                </div>
                <div className="final-player-resources">
                  <span className="final-resource">🍫 可可: {player.cocoa}</span>
                  <span className="final-resource">🪵 木材: {player.timber}</span>
                  <span className="final-resource">👷 工人: {player.workers}</span>
                  {player.joinCoop && (
                    <span className="final-resource coop">🤝 合作社成员</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function CooperativeMembersPanel({ 
  players, 
  coopMembers 
}: { 
  players: GameState['players'];
  coopMembers: string[];
}) {
  // 获取合作社成员信息
  const members = coopMembers
    .map((memberId) => {
      const player = players.find((p) => p.id === parseInt(memberId));
      return player
        ? {
            playerId: player.id,
            playerName: player.name || `玩家 ${player.id + 1}`,
          }
        : null;
    })
    .filter((member): member is NonNullable<typeof member> => member !== null);

  if (members.length === 0) {
    return (
      <div className="cooperative-panel">
        <h3>🤝 合作社成员</h3>
        <div className="cooperative-members-list">
          <div className="cooperative-member-item empty">
            <span>目前没有合作社成员</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cooperative-panel">
      <h3>🤝 合作社成员</h3>
      <div className="cooperative-members-list">
        {members.map((member) => (
          <div key={member.playerId} className="cooperative-member-item">
            <span className="member-name">{member.playerName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CurrentTurnIndicator({
  currentPlayerId,
  currentPlayer,
  phase,
  isYourTurn,
}: {
  currentPlayerId: string;
  currentPlayer: GameState['players'][0] | undefined;
  phase: GameState['phase'];
  isYourTurn: boolean;
}) {
  const displayName = currentPlayer?.name || `玩家 ${parseInt(currentPlayerId)}`;

  const phaseLabels: Record<GameState['phase'], string> = {
    'SETUP': '⚙️ 设置阶段',
    'townHall': '🏛️ 市政厅讨论',
    'action': '☀️ 行动阶段',
    'secret': '🌙 秘密行动阶段',
    'calculation': '📊 结算阶段',
    'gameOver': '🏆 游戏结束',
    'registration': '🔄 注册阶段',
  };

  return (
    <div className={`current-turn-indicator ${isYourTurn ? 'your-turn' : ''}`}>
      <div className="turn-info">
        <span className="turn-label">当前回合</span>
        <span className="turn-player">
          {isYourTurn ? '👉 ' : ''}
          {displayName}
          {isYourTurn ? ' (你的回合)' : ''}
        </span>
      </div>
      <div className="turn-phase">
        {phaseLabels[phase] || phase}
      </div>
    </div>
  );
}

function PhaseIndicator({ 
  phase, 
  round,
}: { 
  phase: GameState['phase'];
  round: number;
}) {
  const phaseLabels: Record<GameState['phase'], { name: string; desc: string }> = {
    'SETUP': { name: '⚙️ 设置阶段', desc: '游戏初始化中...' },
    'townHall': { name: '🏛️ 市政厅讨论', desc: '支付生活成本，讨论策略' },
    'action': { name: '☀️ 行动阶段', desc: '玩家轮流执行行动' },
    'secret': { name: '🌙 秘密行动阶段', desc: '所有玩家同时选择秘密行动' },
    'calculation': { name: '📊 结算阶段', desc: '计算生态变化和资源更新' },
    'gameOver': { name: '🏆 游戏结束', desc: '感谢游玩！' },
    'registration': { name: '🔄 注册阶段', desc: '玩家准备阶段' },
  };

  const phaseInfo = phaseLabels[phase] || { name: phase, desc: '' };

  return (
    <div className={`phase-indicator phase-${phase}`}>
      <div className="phase-info">
        <span className="round-number">第 {round} 轮</span>
        <span className="phase-name">{phaseInfo.name}</span>
      </div>
      <div className="phase-description">{phaseInfo.desc}</div>
    </div>
  );
}

export function SaoTomeBoard({ G, ctx, moves, playerID, hotseatMode, playerNames }: SaoTomeBoardProps) {
  // Safety check: Ensure G exists
  if (!G) {
    return (
      <div className="sao-tome-board">
        <div style={{ padding: '20px', textAlign: 'center' }}>游戏状态加载中...</div>
      </div>
    );
  }
  
  // Safety check: Ensure players array exists
  if (!G.players || G.players.length === 0) {
    return (
      <div className="sao-tome-board">
        <div style={{ padding: '20px', textAlign: 'center' }}>等待玩家数据...</div>
      </div>
    );
  }
  
  // Get current turn's player ID from ctx
  const currentTurnPlayerId = ctx.currentPlayer || '0';
  
  // For hotseat mode, we control all players
  // For online mode, playerID is fixed
  // Check if playerID is null/undefined or not in players list (spectator mode)
  const isSpectator = !hotseatMode && (playerID === null || playerID === undefined || !G.players.some(p => p.id === parseInt(playerID || '0')));
  const myPlayerId = hotseatMode ? currentTurnPlayerId : (isSpectator ? null : (playerID || '0'));
  
  // Check if it's my turn (spectators never have a turn)
  const isMyTurn = !isSpectator && myPlayerId === currentTurnPlayerId;
  
  // Find current player from array
  const currentTurnPlayer = G.players.find(p => p.id === parseInt(currentTurnPlayerId));
  const myPlayer = isSpectator ? null : G.players.find(p => p.id === parseInt(myPlayerId || '0'));
  // Set player names on game start if provided (only once)
  useEffect(() => {
    console.log('useEffect playerNames', playerNames, myPlayerId);
    if (G.round === 0 && myPlayerId !== null) {
      G.players.forEach((player, index) => {
        if (parseInt(myPlayerId || '0') !== player.id) {
          return;
        }
        if (playerNames && playerNames[index] && playerNames[index] !== player.name) {
          moves.ready?.(playerNames[index], index);
        }
      });
    }
  }, [playerNames, moves.ready, myPlayerId]);

  // Use names from game state
  const getPlayerWithCustomName = (player: GameState['players'][0]) => {
    return player;
  };

  const boardMoves = {
    farmCocoa: (cellId: string) => moves.farmCocoa?.(cellId),
    transferResource: (targetPlayerId: string, resource: 'COCOA' | 'TIMBER', amount: number) => 
      moves.transferResource?.(targetPlayerId, resource, amount),
    logBuffer: () => moves.logBuffer?.(),
    extendFarm: (targetCellId: string) => moves.extendFarm?.(targetCellId),
    abandonFarm: (targetCellId: string) => moves.abandonFarm?.(targetCellId),
    huntSnail: (zone: 'CORE' | 'BUFFER') => moves.huntSnail?.(zone),
    joinCoop: () => moves.joinCoop?.(),
    retrieveWorker: () => moves.retrieveWorker?.(),
    doNothing: () => moves.doNothing?.(),
    steal: (targetPlayerId: number, amount: number) => moves.steal?.(targetPlayerId, amount),
    illegalLog: (zone: 'CORE' | 'BUFFER', amount: number) => moves.illegalLog?.(zone, amount),
    payLivingCost: () => moves.payLivingCost?.(),
    sendWorkerToPortugal: () => moves.sendWorkerToPortugal?.(),
    endTurn: () => moves.endTurn?.(),
    setMyName: (name: string) => moves.setMyName?.(name),
  };

  // Show debriefing if game is over
  if (G.phase === 'gameOver') {
    return (
      <div className="sao-tome-board">
        <DebriefingPanel G={G} />
      </div>
    );
  }

  return (
    <div className="sao-tome-board">
      <header className="game-header">
        <h1>🏝️ 圣多美岛农民</h1>
        <p className="subtitle">São Tomé Island Farmers</p>
      </header>

      {/* Current Turn Indicator */}
      <CurrentTurnIndicator
        currentPlayerId={currentTurnPlayerId}
        currentPlayer={currentTurnPlayer}
        phase={G.phase}
        isYourTurn={isMyTurn}
      />

      <div className="game-status-bar">
        <PhaseIndicator
          phase={G.phase}
          round={G.round}
        />
        <EcosystemDisplay G={G} />
      </div>

      <div className="game-main">
        {isSpectator && (
          <div className="spectator-banner">
            <h2>👁️ 旁观者模式</h2>
            <p>您可以查看所有玩家的完整信息，但无法执行任何行动</p>
          </div>
        )}
        <div className="players-area">
          {G.players && G.players.length > 0 ? (
            G.players.map((player) => {
              const playerIdNum = player.id;
              const isCurrentPlayer = playerIdNum === parseInt(currentTurnPlayerId);
              // In hotseat mode, canAct if it's the current player's turn
              // In online mode, canAct if it's my player and my turn
              // Spectators can never act
              const canPlayerAct = isSpectator 
                ? false 
                : hotseatMode 
                  ? isCurrentPlayer && isMyTurn
                  : playerIdNum === parseInt(myPlayerId || '0') && isMyTurn;
              
              return (
                <PlayerPanel
                  key={player.id}
                  player={getPlayerWithCustomName(player)}
                  isCurrentTurn={isCurrentPlayer}
                  isMyPlayer={isSpectator ? false : (hotseatMode ? isCurrentPlayer : playerIdNum === parseInt(myPlayerId || '0'))}
                  isSpectator={isSpectator}
                  canAct={canPlayerAct}
                  gameState={G}
                  moves={boardMoves}
                  allPlayers={G.players.map(p => getPlayerWithCustomName(p))}
                />
              );
            })
          ) : (
            <div>没有玩家数据</div>
          )}
        </div>

        <aside className="game-sidebar">
          <GameLog logs={G.logs} />
          
          {/* 合作社成员列表 */}
          <CooperativeMembersPanel players={G.players} coopMembers={G.coopMembers} />
          
          {/* 葡萄牙家庭人数显示 */}
          <PortugalFamiliesPanel players={G.players} />
          
          <div className="game-rules-hint">
            <h4>💡 游戏规则</h4>
            <ul>
              <li>每轮开始支付生活成本（木材 + 可可）</li>
              <li>行动阶段：根据工人数量执行行动</li>
              <li>秘密行动阶段：所有玩家同时选择</li>
              <li>结算阶段：计算生态变化和资源更新</li>
              <li>第6轮结束后游戏结束</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
