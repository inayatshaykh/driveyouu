import { createWebSocketServer } from './websocket';

const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001;

// Start WebSocket server
const wss = createWebSocketServer(WS_PORT);

console.log(`
🚀 WebSocket Server Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Port:        ${WS_PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  URL:         ws://localhost:${WS_PORT}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Real-time Features:
  ✓ Driver location tracking
  ✓ Booking status updates
  ✓ Live ETA calculations
  ✓ Driver status monitoring

Ready to accept connections...
`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing WebSocket server');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing WebSocket server');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
