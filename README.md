# 🏝️ São Tomé Island Farmers

A multiplayer strategy game based on ecological balance

---

## 📖 About

On the island of São Tomé, you are a farmer struggling to survive. Accumulate wealth by growing cocoa, logging trees, and hunting snails, but beware of ecological pressure! The game tests your resource management skills and strategic planning.

## ✨ Features

- 🎮 **Multiple Game Modes**
  - Local Hotseat: Play face-to-face
  - Online Multiplayer: Support remote play
  - Spectator Mode: GM can observe game progress

- 🌍 **Ecological Balance System**
  - Dynamic tree and snail populations
  - Environmental penalty mechanism
  - Living costs vary with ecology

- 🤝 **Cooperative System**
  - Join directly in Round 2
  - Apply to join from Round 3 onwards
  - Cooperative members can share land resources

- 📊 **Complete Game Summary**
  - Ecosystem change tracking
  - Historical data timeline
  - Complete game logs

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Game Engine**: boardgame.io
- **Styling**: CSS3 (Custom Theme)

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Development Mode

Start both frontend and server (runs simultaneously):

```bash
npm run dev:all
```

Or start separately:

```bash
# Start frontend dev server
npm run dev

# Start game server (new terminal)
npm run server
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🎯 Game Modes

### Local Hotseat Mode

All players share one device and take turns. Perfect for playing face-to-face with friends.

### Online Multiplayer Mode

**Create Room**:
1. Select "Create Room" mode
2. Set number of players (2-5)
3. Click "Create Room"
4. Share the room ID with other players

**Join Room**:
1. Select "Join Room" mode
2. Enter the room ID
3. Enter your name
4. Choose a player slot or join as spectator

## 📁 Project Structure

```
src/
├── game/
│   ├── Board.tsx          # Main game board
│   ├── PlayerPanel.tsx    # Player panel component
│   ├── Lobby.tsx          # Game lobby
│   ├── game.ts            # Game logic definition
│   ├── game_logic.ts      # Game rules implementation
│   ├── core_data_structure.ts  # Data structure definitions
│   └── game.css           # Game styles
├── App.tsx                # App entry point
└── main.tsx              # App bootstrap

server/
└── index.ts              # Game server
```

## 🎲 Game Rules

### Game Phases

1. **Town Hall Phase** - Pay living costs or send workers to Portugal
2. **Action Phase** - Execute actions based on worker count
3. **Secret Action Phase** - All players choose secret actions simultaneously
4. **Calculation Phase** - Calculate ecological changes and resource updates

### Main Actions

- 🌾 **Farm Cocoa** - Plant on your own land or cooperative members' land
- 🪓 **Log Trees** - Log in buffer zone to get timber
- 🐌 **Hunt Snails** - Hunt in core or buffer zone to get cocoa
- 💰 **Transfer Resources** - Trade resources with other players (with restrictions)
- 🤝 **Join Cooperative** - Gain cooperative privileges

### Ecological Impact

- Tree count affects snail reproduction
- Snail count affects living costs
- Ecological imbalance triggers environmental penalties

## 🔧 Development Notes

### Server Configuration

The default server address is automatically set to the current page URL with port changed to 8000. For example:
- If accessing `http://example.com:3000`, default server is `http://example.com:8000`

### Requirements

- Node.js 18+
- npm or yarn

## 📝 License

This project is private.

---

**Enjoy the game!** 🎉
