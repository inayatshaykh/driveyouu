# WebSocket Integration Guide 🔌

This document explains the real-time WebSocket implementation for UR's Chauffeur Platform.

## Overview

The WebSocket server enables real-time communication between customers, drivers, and the platform for:
- Live driver location tracking
- Real-time booking status updates
- Driver availability monitoring
- Instant notifications

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Customer  │◄───────►│   WebSocket  │◄───────►│   Driver    │
│   (React)   │         │    Server    │         │   (React)   │
└─────────────┘         └──────────────┘         └─────────────┘
                               ▲
                               │
                               ▼
                        ┌──────────────┐
                        │    Admin     │
                        │   (React)    │
                        └──────────────┘
```

## Server Setup

### Starting the WebSocket Server

**Development (with auto-reload):**
```bash
npm run dev:ws
```

**Development (both app and WebSocket):**
```bash
npm run dev:all
```

**Production:**
```bash
npm run start:ws
```

### Configuration

Add to your `.env` file:
```env
WS_PORT=3001
VITE_WS_URL=ws://localhost:3001
```

For production:
```env
WS_PORT=3001
VITE_WS_URL=wss://your-domain.com
```

## Message Protocol

### Authentication

**Client → Server:**
```json
{
  "type": "auth",
  "payload": {
    "token": "jwt-token-here"
  }
}
```

**Server → Client:**
```json
{
  "type": "auth_success",
  "payload": {
    "userId": "user-id",
    "role": "customer|driver|admin"
  }
}
```

### Join Booking Room

**Client → Server:**
```json
{
  "type": "join_booking",
  "payload": {
    "bookingId": "booking-id"
  }
}
```

**Server → Client:**
```json
{
  "type": "joined_booking",
  "payload": {
    "bookingId": "booking-id"
  }
}
```

### Location Update (Driver Only)

**Driver → Server:**
```json
{
  "type": "location_update",
  "payload": {
    "bookingId": "booking-id",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "heading": 45,
    "speed": 30
  }
}
```

**Server → All Clients in Booking:**
```json
{
  "type": "location_update",
  "payload": {
    "bookingId": "booking-id",
    "driverId": "driver-id",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "heading": 45,
    "speed": 30,
    "timestamp": "2026-05-17T10:30:00Z"
  }
}
```

### Booking Status Update

**Client → Server:**
```json
{
  "type": "booking_status_update",
  "payload": {
    "bookingId": "booking-id",
    "status": "in_progress",
    "data": {}
  }
}
```

**Server → All Clients in Booking:**
```json
{
  "type": "booking_status_update",
  "payload": {
    "bookingId": "booking-id",
    "status": "in_progress",
    "data": {},
    "timestamp": "2026-05-17T10:30:00Z"
  }
}
```

### Driver Status Update (Driver Only)

**Driver → Server:**
```json
{
  "type": "driver_status_update",
  "payload": {
    "status": "available|busy|offline",
    "latitude": 28.6139,
    "longitude": 77.2090
  }
}
```

**Server → Admin Clients:**
```json
{
  "type": "driver_status_update",
  "payload": {
    "driverId": "driver-id",
    "status": "available",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "timestamp": "2026-05-17T10:30:00Z"
  }
}
```

## Client Usage

### React Hook (Recommended)

```typescript
import { useWebSocket } from '../hooks/useWebSocket';

function MyComponent() {
  const { isConnected, subscribe, joinBooking, updateLocation } = useWebSocket();

  useEffect(() => {
    // Join a booking room
    joinBooking('booking-123');

    // Subscribe to location updates
    const unsubscribe = subscribe('location_update', (payload) => {
      console.log('Driver location:', payload);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>;
}
```

### Booking Tracking Hook

```typescript
import { useBookingTracking } from '../hooks/useWebSocket';

function LiveTracking({ bookingId }) {
  const { driverLocation, bookingStatus, isConnected } = useBookingTracking(bookingId);

  return (
    <div>
      {driverLocation && (
        <p>Driver at: {driverLocation.latitude}, {driverLocation.longitude}</p>
      )}
      <p>Status: {bookingStatus}</p>
    </div>
  );
}
```

### Driver Location Updates

```typescript
import { useDriverLocationUpdates } from '../hooks/useWebSocket';

function DriverApp({ bookingId }) {
  const { isTracking, startTracking, stopTracking } = useDriverLocationUpdates(bookingId);

  return (
    <div>
      <button onClick={startTracking}>Start Tracking</button>
      <button onClick={stopTracking}>Stop Tracking</button>
      <p>Tracking: {isTracking ? 'Active' : 'Inactive'}</p>
    </div>
  );
}
```

## Features

### 1. Real-time Driver Location Tracking

- Automatic location updates every 5 seconds
- High accuracy GPS tracking
- Heading and speed information
- Broadcast to all clients in booking room

### 2. Live Booking Status

- Instant status updates (assigned, en route, in progress, completed)
- Synchronized across all connected clients
- No polling required

### 3. Connection Management

- Automatic reconnection with exponential backoff
- Heartbeat mechanism to detect broken connections
- Graceful handling of network issues

### 4. Room-based Broadcasting

- Booking rooms for targeted updates
- Only relevant clients receive updates
- Efficient message routing

## Security

### Authentication

- JWT token required for connection
- Token verified on connection
- Invalid tokens rejected immediately

### Authorization

- Role-based message filtering
- Drivers can only update their own location
- Admins receive all driver status updates

### Data Validation

- All messages validated before processing
- Invalid messages rejected with error response
- Type checking on all payloads

## Performance

### Optimization Techniques

1. **Connection Pooling**: Reuse connections per user
2. **Message Batching**: Group updates when possible
3. **Selective Broadcasting**: Only send to relevant clients
4. **Heartbeat**: Detect and clean up dead connections

### Scalability

For production with multiple servers:

1. **Use Redis Pub/Sub** for cross-server communication
2. **Load Balancer** with sticky sessions
3. **Horizontal Scaling** with shared state

Example with Redis:
```typescript
import Redis from 'ioredis';

const pub = new Redis();
const sub = new Redis();

// Publish location update
pub.publish('location_updates', JSON.stringify(locationData));

// Subscribe to updates
sub.subscribe('location_updates');
sub.on('message', (channel, message) => {
  // Broadcast to local clients
});
```

## Monitoring

### Connection Stats

```typescript
import { getConnectionStats } from './server/websocket';

const stats = getConnectionStats();
console.log(stats);
// {
//   totalConnections: 150,
//   uniqueUsers: 120,
//   activeBookings: 45
// }
```

### Logging

The server logs:
- New connections
- Authentication attempts
- Message types received
- Errors and disconnections

## Troubleshooting

### Connection Failed

**Problem**: Client cannot connect to WebSocket server

**Solutions**:
1. Check if WebSocket server is running: `npm run dev:ws`
2. Verify `VITE_WS_URL` in `.env`
3. Check firewall settings
4. Ensure port 3001 is not in use

### Authentication Failed

**Problem**: "Invalid token" error

**Solutions**:
1. Verify JWT token is valid
2. Check token expiration
3. Ensure `JWT_SECRET` matches between app and WS server

### Location Not Updating

**Problem**: Driver location not appearing on customer map

**Solutions**:
1. Check if driver has joined booking room
2. Verify location permissions granted
3. Check browser console for errors
4. Ensure `startTracking()` was called

### High Latency

**Problem**: Slow message delivery

**Solutions**:
1. Check network connection
2. Reduce update frequency
3. Use message batching
4. Consider Redis for scaling

## Testing

### Manual Testing

1. **Start servers:**
   ```bash
   npm run dev:all
   ```

2. **Open browser console:**
   ```javascript
   const ws = new WebSocket('ws://localhost:3001');
   ws.onopen = () => {
     ws.send(JSON.stringify({
       type: 'auth',
       payload: { token: 'your-jwt-token' }
     }));
   };
   ws.onmessage = (event) => {
     console.log('Received:', JSON.parse(event.data));
   };
   ```

### Automated Testing

```typescript
import WebSocket from 'ws';

describe('WebSocket Server', () => {
  it('should authenticate valid token', (done) => {
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'auth',
        payload: { token: validToken }
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      expect(message.type).toBe('auth_success');
      done();
    });
  });
});
```

## Production Deployment

### Using PM2

```bash
# Start WebSocket server
pm2 start server/index.ts --name "ws-server" --interpreter tsx

# Monitor
pm2 monit

# Logs
pm2 logs ws-server
```

### Using Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start:ws"]
```

### Nginx Proxy

```nginx
location /ws {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400;
}
```

## Best Practices

1. **Always authenticate** before sending messages
2. **Join booking room** before expecting updates
3. **Handle reconnection** gracefully in UI
4. **Clean up subscriptions** on component unmount
5. **Validate data** before sending
6. **Use TypeScript** for type safety
7. **Log errors** for debugging
8. **Monitor connections** in production

## Support

For WebSocket issues:
- Check server logs: `pm2 logs ws-server`
- Enable debug mode: `DEBUG=ws:* npm run dev:ws`
- Review browser console for client errors

---

**Built with ❤️ for real-time driver tracking**
