// São Tomé Island Farmers - Main App
import { useMemo } from 'react';
import { Client } from 'boardgame.io/react';
import { Local, SocketIO } from 'boardgame.io/multiplayer';
import { SaoTomeGame, SaoTomeBoard } from './game';
import { Lobby, type GameConfig } from './game/Lobby';
import { useState } from 'react';

// Create hotseat client (local multiplayer where all players share one screen)
function createHotseatClient(numPlayers: number, playerNames: string[]) {
  return Client({
    game: SaoTomeGame,
    board: (props) => (
      <SaoTomeBoard 
        {...props} 
        hotseatMode={true} 
        playerNames={playerNames}
      />
    ),
    numPlayers,
    multiplayer: Local(),
    debug: false,
  });
}

// Create online client
function createOnlineClient(numPlayers: number, serverUrl: string) {
  return Client({
    game: SaoTomeGame,
    board: SaoTomeBoard,
    numPlayers,
    multiplayer: SocketIO({ server: serverUrl }),
    debug: false,
  });
}

// Hotseat Game Component - renders all players through the same client
function HotseatGame({ config }: { config: GameConfig }) {
  const HotseatClient = useMemo(
    () => createHotseatClient(config.numPlayers, config.playerNames),
    [config.numPlayers, config.playerNames]
  );

  // In hotseat mode, we use playerID="0" but the board component
  // handles switching between players internally
  return <HotseatClient playerID="0" />;
}

// Online Game Component
function OnlineGame({ config }: { config: GameConfig }) {
  const OnlineClient = useMemo(
    () => createOnlineClient(config.numPlayers, config.serverUrl || 'http://localhost:8000'),
    [config.numPlayers, config.serverUrl]
  );

  // Connect with matchID, playerID, and credentials
  return (
    <OnlineClient 
      playerID={config.playerID} 
      matchID={config.matchID}
      credentials={config.credentials}
    />
  );
}

function App() {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  // Still in lobby
  if (!gameConfig) {
    return <Lobby onStartGame={setGameConfig} />;
  }

  // Hotseat mode
  if (gameConfig.mode === 'hotseat') {
    return <HotseatGame config={gameConfig} />;
  }

  // Online mode - credentials should already be set from Lobby
  return <OnlineGame config={gameConfig} />;
}

export default App;
