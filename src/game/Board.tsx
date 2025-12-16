// São Tomé Island Farmers - Main Board Component
import type { BoardProps } from 'boardgame.io/react';
import type { GameState, NightAction } from './types';
import { CONSTANTS } from './types';
import { PlayerPanel } from './PlayerPanel';
import './game.css';

interface SaoTomeBoardProps extends BoardProps<GameState> {
  hotseatMode?: boolean;
  playerNames?: string[];
}

function EcosystemMeter({ pressure }: { pressure: number }) {
  const percentage = Math.min(100, pressure);
  const status = pressure >= CONSTANTS.ECOSYSTEM_CRITICAL 
    ? 'critical' 
    : pressure >= CONSTANTS.ECOSYSTEM_THRESHOLD 
      ? 'warning' 
      : 'healthy';

  return (
    <div className={`ecosystem-meter ${status}`}>
      <div className="meter-label">
        🌍 生态系统压力
      </div>
      <div className="meter-bar">
        <div 
          className="meter-fill" 
          style={{ width: `${percentage}%` }}
        />
        <div className="meter-markers">
          <div className="marker threshold" style={{ left: `${CONSTANTS.ECOSYSTEM_THRESHOLD}%` }} />
          <div className="marker critical" style={{ left: `${CONSTANTS.ECOSYSTEM_CRITICAL}%` }} />
        </div>
      </div>
      <div className="meter-value">{pressure}/100</div>
      <div className="meter-status">
        {status === 'critical' && '🔥 危险！生态崩溃！'}
        {status === 'warning' && '⚠️ 警告：维持成本增加'}
        {status === 'healthy' && '🌿 生态系统健康'}
      </div>
    </div>
  );
}

function GameEventLog({ events }: { events: GameState['events'] }) {
  const recentEvents = events.slice(-10).reverse();

  return (
    <div className="event-log">
      <h3>📜 事件日志</h3>
      <div className="events-list">
        {recentEvents.map((event, i) => (
          <div key={i} className={`event-item ${event.type}`}>
            <span className="event-round">R{event.round}</span>
            <span className="event-phase">{event.phase === 'day' ? '☀️' : '🌙'}</span>
            <span className="event-message">{event.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CurrentTurnIndicator({
  currentPlayerId,
  currentPlayerName,
  phase,
  isYourTurn,
  playerNames,
}: {
  currentPlayerId: string;
  currentPlayerName: string;
  phase: GameState['phase'];
  isYourTurn: boolean;
  playerNames?: string[];
}) {
  const displayName = playerNames?.[parseInt(currentPlayerId)] || currentPlayerName;

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
        {phase === 'day' && '☀️ 白天 - 执行行动'}
        {phase === 'night' && '🌙 夜晚 - 选择秘密行动'}
        {phase === 'nightReveal' && '🔮 揭示夜间行动'}
        {phase === 'gameEnd' && '🏆 游戏结束'}
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
  return (
    <div className={`phase-indicator phase-${phase}`}>
      <div className="phase-info">
        <span className="round-number">第 {round} 回合</span>
        <span className="phase-name">
          {phase === 'day' && '☀️ 白天阶段'}
          {phase === 'night' && '🌙 夜晚阶段'}
          {phase === 'nightReveal' && '🔮 揭示阶段'}
          {phase === 'gameEnd' && '🏆 游戏结束'}
        </span>
      </div>
      <div className="phase-description">
        {phase === 'day' && '玩家轮流执行行动，用完行动点或点击结束回合后轮到下一位'}
        {phase === 'night' && '玩家轮流选择秘密行动，选择后自动轮到下一位'}
        {phase === 'nightReveal' && '所有夜间行动已揭示！'}
        {phase === 'gameEnd' && '感谢游玩！'}
      </div>
    </div>
  );
}

function WinConditionTracker({ 
  players, 
  target,
  playerNames,
  currentTurnPlayerId,
}: { 
  players: GameState['players']; 
  target: number;
  playerNames?: string[];
  currentTurnPlayerId?: string;
}) {
  const sortedPlayers = Object.values(players).sort((a, b) => b.cocoa - a.cocoa);

  return (
    <div className="win-tracker">
      <h3>🏆 胜利进度 (目标: {target} 可可)</h3>
      <div className="progress-list">
        {sortedPlayers.map((player) => {
          const progress = Math.min(100, (player.cocoa / target) * 100);
          const displayName = playerNames?.[parseInt(player.id)] || player.name;
          const isCurrentTurn = player.id === currentTurnPlayerId;
          return (
            <div key={player.id} className={`player-progress ${isCurrentTurn ? 'current-turn' : ''}`}>
              <span className="progress-name">
                {isCurrentTurn && '▶ '}
                {displayName}
              </span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-value">{player.cocoa}/{target}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GameOverScreen({ 
  winner, 
  players,
  playerNames,
}: { 
  winner: string; 
  players: GameState['players'];
  playerNames?: string[];
}) {
  const winnerPlayer = players[winner];
  const sortedPlayers = Object.values(players).sort((a, b) => b.cocoa - a.cocoa);
  const winnerName = playerNames?.[parseInt(winner)] || winnerPlayer?.name;

  return (
    <div className="game-over-overlay">
      <div className="game-over-content">
        <h1>🎉 游戏结束！</h1>
        <div className="winner-announcement">
          <span className="winner-emoji">👑</span>
          <h2>{winnerName} 获胜！</h2>
          <p>最终可可数量: {winnerPlayer?.cocoa}</p>
        </div>
        <div className="final-standings">
          <h3>最终排名</h3>
          {sortedPlayers.map((player, index) => {
            const displayName = playerNames?.[parseInt(player.id)] || player.name;
            return (
              <div key={player.id} className={`standing-row ${index === 0 ? 'winner' : ''}`}>
                <span className="standing-rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </span>
                <span className="standing-name">{displayName}</span>
                <span className="standing-cocoa">{player.cocoa} 🍫</span>
              </div>
            );
          })}
        </div>
        <button 
          className="restart-btn"
          onClick={() => window.location.reload()}
        >
          🔄 重新开始
        </button>
      </div>
    </div>
  );
}

export function SaoTomeBoard({ G, ctx, moves, playerID, hotseatMode, playerNames }: SaoTomeBoardProps) {
  // Get current turn's player ID from ctx
  const currentTurnPlayerId = ctx.currentPlayer;
  
  // For hotseat mode, we control all players
  // For online mode, playerID is fixed
  const myPlayerId = hotseatMode ? currentTurnPlayerId : (playerID || '0');
  
  // Check if it's my turn
  const isMyTurn = myPlayerId === currentTurnPlayerId;
  
  const currentTurnPlayer = G.players[currentTurnPlayerId];
  const allPlayers = Object.values(G.players);

  // Update player names in G if provided
  const getPlayerWithCustomName = (player: typeof currentTurnPlayer, index: number) => {
    if (playerNames && playerNames[index]) {
      return { ...player, name: playerNames[index] };
    }
    return player;
  };

  const boardMoves = {
    plantCocoa: (landId: string) => moves.plantCocoa(landId),
    harvestCocoa: (landId: string) => moves.harvestCocoa(landId),
    cutTree: (landId: string) => moves.cutTree(landId),
    improveLand: (landId: string) => moves.improveLand(landId),
    endTurn: () => moves.endTurn(),
    setNightAction: (action: NightAction) => moves.setNightAction(action),
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
        currentPlayerName={currentTurnPlayer?.name || ''}
        phase={G.phase}
        isYourTurn={isMyTurn}
        playerNames={playerNames}
      />

      <div className="game-status-bar">
        <PhaseIndicator
          phase={G.phase}
          round={G.currentRound}
        />
        <EcosystemMeter pressure={G.ecosystemPressure} />
      </div>

      <div className="game-main">
        <div className="players-area">
          {allPlayers.map((player, index) => (
            <PlayerPanel
              key={player.id}
              player={getPlayerWithCustomName(player, index)}
              isCurrentTurn={player.id === currentTurnPlayerId}
              isMyPlayer={hotseatMode ? player.id === currentTurnPlayerId : player.id === myPlayerId}
              canAct={isMyTurn && player.id === currentTurnPlayerId}
              gameState={G}
              moves={boardMoves}
              allPlayers={allPlayers.map((p, i) => getPlayerWithCustomName(p, i))}
            />
          ))}
        </div>

        <aside className="game-sidebar">
          <WinConditionTracker 
            players={G.players} 
            target={CONSTANTS.WIN_COCOA_TARGET}
            playerNames={playerNames}
            currentTurnPlayerId={currentTurnPlayerId}
          />
          <GameEventLog events={G.events} />
          
          <div className="game-rules-hint">
            <h4>💡 提示</h4>
            <ul>
              <li>种植可可需要 2 回合成长</li>
              <li>土地质量影响收获数量</li>
              <li>砍树获得木材但增加生态压力</li>
              <li>夜晚行动有风险但收益高</li>
              <li>生态压力 &gt;50 会增加维持成本</li>
              <li>首先达到 {CONSTANTS.WIN_COCOA_TARGET} 可可获胜！</li>
            </ul>
          </div>
        </aside>
      </div>

      {G.phase === 'gameEnd' && G.winner && (
        <GameOverScreen 
          winner={G.winner} 
          players={G.players}
          playerNames={playerNames}
        />
      )}
    </div>
  );
}
