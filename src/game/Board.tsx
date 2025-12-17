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
  const myPlayerId = hotseatMode ? currentTurnPlayerId : (playerID || '0');
  
  // Check if it's my turn
  const isMyTurn = myPlayerId === currentTurnPlayerId;
  
  // Find current player from array
  const currentTurnPlayer = G.players.find(p => p.id === parseInt(currentTurnPlayerId));
  const myPlayer = G.players.find(p => p.id === parseInt(myPlayerId));
  // Set player names on game start if provided (only once)
  useEffect(() => {
    console.log('useEffect playerNames', playerNames, myPlayerId);
    if (G.round === 0) {
      G.players.forEach((player, index) => {
        if (parseInt(myPlayerId) !== player.id) {
          return;
        }
        if (playerNames && playerNames[index] && playerNames[index] !== player.name) {
          moves.ready?.(playerNames[index], index);
        }
      });
    }
  }, [playerNames, moves.ready]);

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
    setMyName: (name: string) => moves.setMyName?.(name),
  };

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
        <div className="players-area">
          {G.players && G.players.length > 0 ? (
            G.players.map((player) => {
              const playerIdNum = player.id;
              const isCurrentPlayer = playerIdNum === parseInt(currentTurnPlayerId);
              // In hotseat mode, canAct if it's the current player's turn
              // In online mode, canAct if it's my player and my turn
              const canPlayerAct = hotseatMode 
                ? isCurrentPlayer && isMyTurn
                : playerIdNum === parseInt(myPlayerId) && isMyTurn;
              
              return (
                <PlayerPanel
                  key={player.id}
                  player={getPlayerWithCustomName(player)}
                  isCurrentTurn={isCurrentPlayer}
                  isMyPlayer={hotseatMode ? isCurrentPlayer : playerIdNum === parseInt(myPlayerId)}
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
