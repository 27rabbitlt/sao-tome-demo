// São Tomé Island Farmers - Game Server (TypeScript)
import { Server, Origins } from 'boardgame.io/server';
import { SaoTomeGame } from '../src/game/game';

// Create and start server
const server = Server({
  games: [SaoTomeGame],
  origins: [
    Origins.LOCALHOST,
    Origins.LOCALHOST_IN_DEVELOPMENT,
    // Add your local network IP for LAN play
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  ],
});

const PORT = Number(process.env.PORT) || 8000;

server.run(PORT, () => {
  console.log(`
🏝️  圣多美岛农民 - 游戏服务器已启动！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 服务器地址: http://localhost:${PORT}
📡 等待玩家连接...

使用方法:
1. 确保前端也在运行 (npm run dev)
2. 在游戏大厅选择"创建房间"
3. 将房间 ID 分享给朋友
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});
