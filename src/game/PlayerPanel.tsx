// São Tomé Island Farmers - Player Panel Component
import type { Player, Land, GameState, NightActionType } from './types';
import { CONSTANTS } from './types';

interface PlayerPanelProps {
  player: Player;
  isCurrentTurn: boolean;  // Is it this player's turn?
  isMyPlayer: boolean;     // Is this the player I control?
  canAct: boolean;         // Can I perform actions right now?
  gameState: GameState;
  moves: {
    plantCocoa: (landId: string) => void;
    harvestCocoa: (landId: string) => void;
    cutTree: (landId: string) => void;
    improveLand: (landId: string) => void;
    endTurn: () => void;
    setNightAction: (action: { type: NightActionType; targetPlayerId?: string }) => void;
  };
  allPlayers: Player[];
}

function LandCard({ 
  land, 
  canAct,
  isDayPhase,
  hasActionPoints,
  onPlant,
  onHarvest,
  onCut,
  onImprove,
  hasWood,
}: { 
  land: Land; 
  canAct: boolean;
  isDayPhase: boolean;
  hasActionPoints: boolean;
  onPlant: () => void;
  onHarvest: () => void;
  onCut: () => void;
  onImprove: () => void;
  hasWood: boolean;
}) {
  const qualityStars = '⭐'.repeat(land.quality);
  const growthIndicator = land.hasCocoa 
    ? ['🌱', '🌿', '🌳', '🍫'][land.cocoaGrowthStage] 
    : '🏜️';

  const showActions = canAct && isDayPhase && hasActionPoints;

  return (
    <div className={`land-card quality-${land.quality}`}>
      <div className="land-header">
        <span className="land-quality">{qualityStars}</span>
        {land.hasTree && <span className="land-tree">🌲</span>}
      </div>
      <div className="land-status">
        <span className="growth-indicator">{growthIndicator}</span>
        {land.hasCocoa && (
          <span className="growth-stage">
            {land.cocoaGrowthStage < 3 ? `${land.cocoaGrowthStage}/3` : '可收获!'}
          </span>
        )}
      </div>
      {showActions && (
        <div className="land-actions">
          {!land.hasCocoa && (
            <button onClick={onPlant} className="action-btn plant">
              🌱 种植
            </button>
          )}
          {land.hasCocoa && land.cocoaGrowthStage >= 3 && (
            <button onClick={onHarvest} className="action-btn harvest">
              🍫 收获
            </button>
          )}
          {land.hasTree && (
            <button onClick={onCut} className="action-btn cut">
              🪓 砍树
            </button>
          )}
          {land.quality < 5 && hasWood && (
            <button onClick={onImprove} className="action-btn improve">
              ⬆️ 改善
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NightActionPanel({ 
  player,
  moves,
  allPlayers,
  canAct,
}: {
  player: Player;
  moves: PlayerPanelProps['moves'];
  allPlayers: Player[];
  canAct: boolean;
}) {
  const otherPlayers = allPlayers.filter(p => p.id !== player.id);
  const hasSelectedAction = !!player.secretAction;

  const handleAction = (type: NightActionType, targetPlayerId?: string) => {
    if (!canAct) return;
    moves.setNightAction({ type, targetPlayerId });
  };

  if (hasSelectedAction) {
    return (
      <div className="night-action-panel selected">
        <h4>🌙 夜间行动已选择</h4>
        <p className="action-hint">等待其他玩家...</p>
      </div>
    );
  }

  if (!canAct) {
    return (
      <div className="night-action-panel waiting">
        <h4>🌙 等待轮到你...</h4>
      </div>
    );
  }

  return (
    <div className="night-action-panel">
      <h4>🌙 选择你的夜间行动</h4>
      <div className="night-actions-grid">
        <button 
          className="night-action-btn sleep"
          onClick={() => handleAction('sleep')}
        >
          😴 睡觉<br/>
          <small>安全无风险</small>
        </button>
        
        <button 
          className="night-action-btn hunt"
          onClick={() => handleAction('hunt_snails')}
        >
          🐌 捕猎蜗牛<br/>
          <small>+{CONSTANTS.SNAIL_HUNT_AMOUNT * CONSTANTS.SNAIL_TO_COCOA_RATE}可可</small>
        </button>
        
        <button 
          className="night-action-btn logging"
          onClick={() => handleAction('illegal_logging')}
        >
          🌲 非法伐木<br/>
          <small>+{CONSTANTS.ILLEGAL_LOGGING_WOOD}木材 (有风险)</small>
        </button>
        
        <button 
          className="night-action-btn defense"
          onClick={() => handleAction('set_defense')}
        >
          🛡️ 设置防御<br/>
          <small>防止偷窃/破坏</small>
        </button>
      </div>

      {otherPlayers.length > 0 && (
        <>
          <h5>🎯 针对其他玩家</h5>
          <div className="target-actions">
            {otherPlayers.map(target => (
              <div key={target.id} className="target-player">
                <span className="target-name">{target.name}</span>
                <button 
                  className="night-action-btn steal small"
                  onClick={() => handleAction('steal_cocoa', target.id)}
                >
                  🦝 偷窃
                </button>
                <button 
                  className="night-action-btn sabotage small"
                  onClick={() => handleAction('sabotage_land', target.id)}
                >
                  💀 破坏
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
  const isDayPhase = gameState.phase === 'day';
  const isNightPhase = gameState.phase === 'night';
  const hasActionPoints = player.actionPoints > 0;
  const hasWood = player.wood >= CONSTANTS.LAND_IMPROVE_COST;
  const maintenanceCost = player.population * CONSTANTS.POPULATION_MAINTENANCE * 
    (gameState.ecosystemPressure >= CONSTANTS.ECOSYSTEM_THRESHOLD ? 1.5 : 1);

  return (
    <div className={`player-panel ${isCurrentTurn ? 'current-turn' : ''} ${isMyPlayer ? 'my-player' : ''}`}>
      <div className="player-header">
        <h3>
          {isCurrentTurn && '▶ '}
          {player.name}
          {isMyPlayer && !isCurrentTurn && ' (你)'}
          {isCurrentTurn && ' (当前回合)'}
        </h3>
        {isDayPhase && (
          <span className="action-points">
            ⚡ {player.actionPoints} 行动点
          </span>
        )}
      </div>

      <div className="player-resources">
        <div className="resource cocoa">
          <span className="resource-icon">🍫</span>
          <span className="resource-value">{player.cocoa}</span>
          <span className="resource-label">可可</span>
        </div>
        <div className="resource wood">
          <span className="resource-icon">🪵</span>
          <span className="resource-value">{player.wood}</span>
          <span className="resource-label">木材</span>
        </div>
        <div className="resource population">
          <span className="resource-icon">👨‍👩‍👧</span>
          <span className="resource-value">{player.population}</span>
          <span className="resource-label">人口</span>
        </div>
        <div className="resource snails">
          <span className="resource-icon">🐌</span>
          <span className="resource-value">{player.snails}</span>
          <span className="resource-label">蜗牛</span>
        </div>
      </div>

      <div className="maintenance-cost">
        每回合维持: <span className="cost-value">{Math.floor(maintenanceCost)}</span> 🍫
      </div>

      <div className="player-lands">
        <h4>🏝️ 土地 ({player.lands.length})</h4>
        <div className="lands-grid">
          {player.lands.map(land => (
            <LandCard
              key={land.id}
              land={land}
              canAct={canAct}
              isDayPhase={isDayPhase}
              hasActionPoints={hasActionPoints}
              hasWood={hasWood}
              onPlant={() => moves.plantCocoa(land.id)}
              onHarvest={() => moves.harvestCocoa(land.id)}
              onCut={() => moves.cutTree(land.id)}
              onImprove={() => moves.improveLand(land.id)}
            />
          ))}
        </div>
      </div>

      {/* Day Phase: End Turn Button */}
      {isDayPhase && canAct && (
        <div className="turn-actions">
          <button 
            className="end-turn-btn"
            onClick={() => moves.endTurn()}
          >
            ⏭️ 结束回合
          </button>
          {!hasActionPoints && (
            <p className="no-ap-hint">行动点已用完，请结束回合</p>
          )}
        </div>
      )}

      {/* Night Phase: Action Selection */}
      {isNightPhase && isMyPlayer && (
        <NightActionPanel
          player={player}
          moves={moves}
          allPlayers={allPlayers}
          canAct={canAct}
        />
      )}

      {/* Night Phase: Waiting indicator for other players */}
      {isNightPhase && !isMyPlayer && (
        <div className="night-status-indicator">
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
