// São Tomé Island Farmers - Game Lobby
import { useState } from 'react';
import './lobby.css';

export type GameMode = 'hotseat' | 'online-host' | 'online-join';

interface LobbyProps {
  onStartGame: (config: GameConfig) => void;
}

export interface GameConfig {
  mode: GameMode;
  numPlayers: number;
  playerNames: string[];
  serverUrl?: string;
  matchID?: string;
  playerID?: string;
  credentials?: string;
}

const DEFAULT_NAMES = ['阿明', '小红', '老王', '阿花', '大壮'];

export function Lobby({ onStartGame }: LobbyProps) {
  const [mode, setMode] = useState<GameMode>('hotseat');
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(DEFAULT_NAMES.slice(0, 5));
  // const [serverUrl, setServerUrl] = useState('http://localhost:8000');
  const [serverUrl, setServerUrl] = useState('http://192.168.0.102:8000');
  const [matchID, setMatchID] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For online mode: after creating/finding match, select player slot
  const [pendingMatchID, setPendingMatchID] = useState<string | null>(null);
  const [pendingNumPlayers, setPendingNumPlayers] = useState(2);
  const [joiningSlot, setJoiningSlot] = useState<number | null>(null);

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleCreateMatch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Create a new match on the server
      const response = await fetch(`${serverUrl}/games/sao-tome-farmers/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numPlayers }),
      });
      
      if (!response.ok) {
        throw new Error('创建房间失败');
      }
      
      const data = await response.json();
      setPendingMatchID(data.matchID);
      setPendingNumPlayers(numPlayers);
    } catch (err) {
      setError('无法连接到服务器，请确保服务器已启动');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindMatch = async () => {
    if (!matchID.trim()) {
      setError('请输入房间ID');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      // Get match info to verify it exists and get numPlayers
      const response = await fetch(`${serverUrl}/games/sao-tome-farmers/${matchID.trim()}`);
      
      if (!response.ok) {
        throw new Error('房间不存在');
      }
      
      const matchData = await response.json();
      setPendingMatchID(matchID.trim());
      setPendingNumPlayers(matchData.ctx?.numPlayers || 2);
    } catch (err) {
      setError('找不到该房间，请检查房间ID是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSlot = async (slotIndex: number) => {
    if (!pendingMatchID) return;
    
    setJoiningSlot(slotIndex);
    setError(null);
    try {
      // Join the match at the specified slot
      const response = await fetch(
        `${serverUrl}/games/sao-tome-farmers/${pendingMatchID}/join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerID: String(slotIndex),
            playerName: playerNames[slotIndex] || `玩家${slotIndex + 1}`,
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        if (errorData.includes('already joined') || errorData.includes('seat is full')) {
          throw new Error('该位置已被占用，请选择其他位置');
        }
        throw new Error('加入失败');
      }
      
      const data = await response.json();
      
      // Successfully joined, start the game
      onStartGame({
        mode: mode === 'online-host' ? 'online-host' : 'online-join',
        numPlayers: pendingNumPlayers,
        playerNames: playerNames.slice(0, pendingNumPlayers),
        serverUrl,
        matchID: pendingMatchID,
        playerID: String(slotIndex),
        credentials: data.playerCredentials,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '加入房间失败');
    } finally {
      setJoiningSlot(null);
    }
  };

  const handleStart = () => {
    if (mode === 'hotseat') {
      onStartGame({
        mode,
        numPlayers,
        playerNames: playerNames.slice(0, numPlayers),
      });
    } else if (mode === 'online-host') {
      handleCreateMatch();
    } else if (mode === 'online-join') {
      handleFindMatch();
    }
  };

  const handleBack = () => {
    setPendingMatchID(null);
    setError(null);
  };

  // If we have a pending match, show player slot selection
  if (pendingMatchID) {
    return (
      <div className="lobby-container">
        <div className="lobby-content">
          <header className="lobby-header">
            <h1>🏝️ 圣多美岛农民</h1>
            <p className="subtitle">São Tomé Island Farmers</p>
          </header>

          <div className="lobby-card">
            <h2>🎮 选择你的位置</h2>
            
            <div className="match-info-box">
              <span className="match-label">房间 ID:</span>
              <code className="match-code">{pendingMatchID}</code>
              <button 
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(pendingMatchID);
                  alert('房间ID已复制到剪贴板！');
                }}
              >
                📋 复制
              </button>
            </div>

            <p className="slot-hint">
              选择一个位置加入游戏，将房间 ID 分享给其他玩家
            </p>

            {error && (
              <div className="error-message">{error}</div>
            )}

            <div className="player-slots-grid">
              {Array.from({ length: pendingNumPlayers }).map((_, i) => (
                <button
                  key={i}
                  className={`slot-btn-large ${joiningSlot === i ? 'joining' : ''}`}
                  onClick={() => handleJoinSlot(i)}
                  disabled={joiningSlot !== null}
                >
                  <span className="slot-icon">👤</span>
                  <span className="slot-name">玩家 {i + 1}</span>
                  {joiningSlot === i && <span className="slot-loading">加入中...</span>}
                </button>
              ))}
            </div>

            <button className="back-btn" onClick={handleBack}>
              ← 返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-container">
      <div className="lobby-content">
        <header className="lobby-header">
          <h1>🏝️ 圣多美岛农民</h1>
          <p className="subtitle">São Tomé Island Farmers</p>
        </header>

        <div className="lobby-card">
          <h2>游戏设置</h2>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Game Mode Selection */}
          <div className="setting-group">
            <label>游戏模式</label>
            <div className="mode-selector">
              <button
                className={`mode-btn ${mode === 'hotseat' ? 'active' : ''}`}
                onClick={() => { setMode('hotseat'); setError(null); }}
              >
                <span className="mode-icon">🎮</span>
                <span className="mode-name">本地热座</span>
                <span className="mode-desc">多人轮流操作</span>
              </button>
              <button
                className={`mode-btn ${mode === 'online-host' ? 'active' : ''}`}
                onClick={() => { setMode('online-host'); setError(null); }}
              >
                <span className="mode-icon">🌐</span>
                <span className="mode-name">创建房间</span>
                <span className="mode-desc">在线多人</span>
              </button>
              <button
                className={`mode-btn ${mode === 'online-join' ? 'active' : ''}`}
                onClick={() => { setMode('online-join'); setError(null); }}
              >
                <span className="mode-icon">🔗</span>
                <span className="mode-name">加入房间</span>
                <span className="mode-desc">在线多人</span>
              </button>
            </div>
          </div>

          {/* Number of Players */}
          {mode !== 'online-join' && (
            <div className="setting-group">
              <label>玩家人数</label>
              <div className="player-count-selector">
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`count-btn ${numPlayers === n ? 'active' : ''}`}
                    onClick={() => setNumPlayers(n)}
                  >
                    {n} 人
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Player Names (for hotseat mode) */}
          {mode === 'hotseat' && (
            <div className="setting-group">
              <label>玩家名称</label>
              <div className="player-names-list">
                {Array.from({ length: numPlayers }).map((_, i) => (
                  <div key={i} className="player-name-input">
                    <span className="player-number">玩家 {i + 1}</span>
                    <input
                      type="text"
                      value={playerNames[i] || ''}
                      onChange={(e) => handleNameChange(i, e.target.value)}
                      placeholder={`玩家 ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Online Settings */}
          {(mode === 'online-host' || mode === 'online-join') && (
            <div className="setting-group">
              <label>服务器地址</label>
              <input
                type="text"
                className="server-input"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://localhost:8000"
              />
            </div>
          )}

          {mode === 'online-join' && (
            <div className="setting-group">
              <label>房间 ID</label>
              <input
                type="text"
                className="match-input"
                value={matchID}
                onChange={(e) => setMatchID(e.target.value)}
                placeholder="输入房间ID"
              />
            </div>
          )}

          {/* Start Button */}
          <button
            className="start-btn"
            onClick={handleStart}
            disabled={isLoading}
          >
            {isLoading ? '连接中...' : 
             mode === 'online-join' ? '查找房间' : 
             mode === 'online-host' ? '创建房间' : '开始游戏'}
          </button>

          {/* Mode Description */}
          <div className="mode-info">
            {mode === 'hotseat' && (
              <p>
                💡 <strong>本地热座模式</strong>：所有玩家共用一台设备，轮流进行操作。
                适合与朋友面对面游玩。
              </p>
            )}
            {mode === 'online-host' && (
              <p>
                💡 <strong>创建房间</strong>：创建一个在线游戏房间，将房间ID分享给朋友加入。
                需要运行游戏服务器。
              </p>
            )}
            {mode === 'online-join' && (
              <p>
                💡 <strong>加入房间</strong>：输入朋友分享的房间ID加入游戏。
              </p>
            )}
          </div>
        </div>

        {/* Game Rules Summary */}
        <div className="lobby-card rules-card">
          <h3>📜 游戏简介</h3>
          <div className="rules-content">
            <p>
              在圣多美岛上，你是一名努力生存的农民。通过种植可可、砍伐树木、
              猎捕蜗牛来积累财富，但要小心生态压力！
            </p>
            <div className="rules-highlights">
              <div className="rule-item">
                <span className="rule-icon">☀️</span>
                <span>白天进行公开行动</span>
              </div>
              <div className="rule-item">
                <span className="rule-icon">🌙</span>
                <span>夜晚进行秘密行动</span>
              </div>
              <div className="rule-item">
                <span className="rule-icon">🏆</span>
                <span>首先达到50可可获胜</span>
              </div>
              <div className="rule-item">
                <span className="rule-icon">🌍</span>
                <span>注意生态平衡</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
