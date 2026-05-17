import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verifyToken } from '../src/services/auth.service';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  role?: string;
  bookingId?: string;
  isAlive?: boolean;
}

interface WSMessage {
  type: string;
  payload: any;
}

// Store active connections
const connections = new Map<string, Set<AuthenticatedWebSocket>>();
const bookingConnections = new Map<string, Set<AuthenticatedWebSocket>>();

export function createWebSocketServer(port: number = 3001) {
  const wss = new WebSocketServer({ port });

  console.log(`🔌 WebSocket server started on port ${port}`);

  // Heartbeat to detect broken connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // 30 seconds

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
    console.log('📱 New WebSocket connection');

    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Authentication
    ws.on('message', async (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());

        switch (message.type) {
          case 'auth':
            await handleAuth(ws, message.payload);
            break;

          case 'join_booking':
            handleJoinBooking(ws, message.payload);
            break;

          case 'leave_booking':
            handleLeaveBooking(ws, message.payload);
            break;

          case 'location_update':
            handleLocationUpdate(ws, message.payload);
            break;

          case 'booking_status_update':
            handleBookingStatusUpdate(ws, message.payload);
            break;

          case 'driver_status_update':
            handleDriverStatusUpdate(ws, message.payload);
            break;

          default:
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Unknown message type' } }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message format' } }));
      }
    });

    ws.on('close', () => {
      console.log('📴 WebSocket connection closed');
      cleanupConnection(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      cleanupConnection(ws);
    });
  });

  return wss;
}

/**
 * Authenticate WebSocket connection
 */
async function handleAuth(ws: AuthenticatedWebSocket, payload: { token: string }) {
  try {
    const { token } = payload;

    if (!token) {
      ws.send(JSON.stringify({ type: 'auth_error', payload: { message: 'Token required' } }));
      ws.close();
      return;
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      ws.send(JSON.stringify({ type: 'auth_error', payload: { message: 'Invalid token' } }));
      ws.close();
      return;
    }

    ws.userId = decoded.userId;
    ws.role = decoded.role;

    // Store connection by user ID
    if (!connections.has(ws.userId)) {
      connections.set(ws.userId, new Set());
    }
    connections.get(ws.userId)!.add(ws);

    ws.send(JSON.stringify({
      type: 'auth_success',
      payload: { userId: ws.userId, role: ws.role },
    }));

    console.log(`✅ User ${ws.userId} (${ws.role}) authenticated`);
  } catch (error) {
    console.error('Auth error:', error);
    ws.send(JSON.stringify({ type: 'auth_error', payload: { message: 'Authentication failed' } }));
    ws.close();
  }
}

/**
 * Join a booking room for real-time updates
 */
function handleJoinBooking(ws: AuthenticatedWebSocket, payload: { bookingId: string }) {
  if (!ws.userId) {
    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Not authenticated' } }));
    return;
  }

  const { bookingId } = payload;

  if (!bookingId) {
    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Booking ID required' } }));
    return;
  }

  ws.bookingId = bookingId;

  // Add to booking room
  if (!bookingConnections.has(bookingId)) {
    bookingConnections.set(bookingId, new Set());
  }
  bookingConnections.get(bookingId)!.add(ws);

  ws.send(JSON.stringify({
    type: 'joined_booking',
    payload: { bookingId },
  }));

  console.log(`📍 User ${ws.userId} joined booking ${bookingId}`);
}

/**
 * Leave a booking room
 */
function handleLeaveBooking(ws: AuthenticatedWebSocket, payload: { bookingId: string }) {
  const { bookingId } = payload;

  if (bookingConnections.has(bookingId)) {
    bookingConnections.get(bookingId)!.delete(ws);
    if (bookingConnections.get(bookingId)!.size === 0) {
      bookingConnections.delete(bookingId);
    }
  }

  ws.bookingId = undefined;

  ws.send(JSON.stringify({
    type: 'left_booking',
    payload: { bookingId },
  }));

  console.log(`📍 User ${ws.userId} left booking ${bookingId}`);
}

/**
 * Handle driver location update
 */
function handleLocationUpdate(ws: AuthenticatedWebSocket, payload: {
  bookingId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}) {
  if (!ws.userId || ws.role !== 'driver') {
    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Only drivers can update location' } }));
    return;
  }

  const { bookingId, latitude, longitude, heading, speed } = payload;

  // Broadcast to all clients in the booking room
  if (bookingConnections.has(bookingId)) {
    const message = JSON.stringify({
      type: 'location_update',
      payload: {
        bookingId,
        driverId: ws.userId,
        latitude,
        longitude,
        heading,
        speed,
        timestamp: new Date().toISOString(),
      },
    });

    bookingConnections.get(bookingId)!.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

/**
 * Handle booking status update
 */
function handleBookingStatusUpdate(ws: AuthenticatedWebSocket, payload: {
  bookingId: string;
  status: string;
  data?: any;
}) {
  if (!ws.userId) {
    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Not authenticated' } }));
    return;
  }

  const { bookingId, status, data } = payload;

  // Broadcast to all clients in the booking room
  if (bookingConnections.has(bookingId)) {
    const message = JSON.stringify({
      type: 'booking_status_update',
      payload: {
        bookingId,
        status,
        data,
        timestamp: new Date().toISOString(),
      },
    });

    bookingConnections.get(bookingId)!.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  console.log(`📊 Booking ${bookingId} status updated to ${status}`);
}

/**
 * Handle driver status update (available, busy, offline)
 */
function handleDriverStatusUpdate(ws: AuthenticatedWebSocket, payload: {
  status: string;
  latitude?: number;
  longitude?: number;
}) {
  if (!ws.userId || ws.role !== 'driver') {
    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Only drivers can update status' } }));
    return;
  }

  const { status, latitude, longitude } = payload;

  // Broadcast to admin clients
  const message = JSON.stringify({
    type: 'driver_status_update',
    payload: {
      driverId: ws.userId,
      status,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    },
  });

  // Send to all admin connections
  connections.forEach((clientSet, userId) => {
    clientSet.forEach((client: AuthenticatedWebSocket) => {
      if (client.role === 'admin' && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  console.log(`🚗 Driver ${ws.userId} status updated to ${status}`);
}

/**
 * Cleanup connection on disconnect
 */
function cleanupConnection(ws: AuthenticatedWebSocket) {
  if (ws.userId && connections.has(ws.userId)) {
    connections.get(ws.userId)!.delete(ws);
    if (connections.get(ws.userId)!.size === 0) {
      connections.delete(ws.userId);
    }
  }

  if (ws.bookingId && bookingConnections.has(ws.bookingId)) {
    bookingConnections.get(ws.bookingId)!.delete(ws);
    if (bookingConnections.get(ws.bookingId)!.size === 0) {
      bookingConnections.delete(ws.bookingId);
    }
  }
}

/**
 * Broadcast message to specific user
 */
export function sendToUser(userId: string, message: any) {
  if (connections.has(userId)) {
    const messageStr = JSON.stringify(message);
    connections.get(userId)!.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
}

/**
 * Broadcast message to all users in a booking
 */
export function sendToBooking(bookingId: string, message: any) {
  if (bookingConnections.has(bookingId)) {
    const messageStr = JSON.stringify(message);
    bookingConnections.get(bookingId)!.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
}

/**
 * Get connection stats
 */
export function getConnectionStats() {
  return {
    totalConnections: Array.from(connections.values()).reduce((sum, set) => sum + set.size, 0),
    uniqueUsers: connections.size,
    activeBookings: bookingConnections.size,
  };
}
