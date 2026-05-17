type MessageHandler = (payload: any) => void;

interface WSMessage {
  type: string;
  payload: any;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers = new Map<string, Set<MessageHandler>>();
  private isAuthenticated = false;
  private authToken: string | null = null;
  private currentBookingId: string | null = null;

  constructor(private url: string = 'ws://localhost:3001') {}

  /**
   * Connect to WebSocket server
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.authToken = token;
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.reconnectAttempts = 0;
        this.authenticate(token).then(resolve).catch(reject);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('📴 WebSocket disconnected');
        this.isAuthenticated = false;
        this.handleReconnect();
      };
    });
  }

  /**
   * Authenticate with the server
   */
  private authenticate(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 5000);

      const authHandler = (payload: any) => {
        clearTimeout(timeout);
        this.off('auth_success', authHandler);
        this.off('auth_error', errorHandler);
        this.isAuthenticated = true;
        resolve();
      };

      const errorHandler = (payload: any) => {
        clearTimeout(timeout);
        this.off('auth_success', authHandler);
        this.off('auth_error', errorHandler);
        reject(new Error(payload.message || 'Authentication failed'));
      };

      this.on('auth_success', authHandler);
      this.on('auth_error', errorHandler);

      this.send('auth', { token });
    });
  }

  /**
   * Handle reconnection
   */
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.authToken) {
        this.connect(this.authToken).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Send message to server
   */
  send(type: string, payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    const message: WSMessage = { type, payload };
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WSMessage) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message.payload));
    }
  }

  /**
   * Subscribe to message type
   */
  on(type: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
  }

  /**
   * Unsubscribe from message type
   */
  off(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Join a booking room
   */
  joinBooking(bookingId: string) {
    if (!this.isAuthenticated) {
      console.error('Not authenticated');
      return;
    }

    this.currentBookingId = bookingId;
    this.send('join_booking', { bookingId });
  }

  /**
   * Leave a booking room
   */
  leaveBooking(bookingId: string) {
    if (!this.isAuthenticated) {
      return;
    }

    this.send('leave_booking', { bookingId });
    if (this.currentBookingId === bookingId) {
      this.currentBookingId = null;
    }
  }

  /**
   * Send location update (driver only)
   */
  updateLocation(bookingId: string, latitude: number, longitude: number, heading?: number, speed?: number) {
    if (!this.isAuthenticated) {
      console.error('Not authenticated');
      return;
    }

    this.send('location_update', {
      bookingId,
      latitude,
      longitude,
      heading,
      speed,
    });
  }

  /**
   * Send booking status update
   */
  updateBookingStatus(bookingId: string, status: string, data?: any) {
    if (!this.isAuthenticated) {
      console.error('Not authenticated');
      return;
    }

    this.send('booking_status_update', {
      bookingId,
      status,
      data,
    });
  }

  /**
   * Send driver status update (driver only)
   */
  updateDriverStatus(status: string, latitude?: number, longitude?: number) {
    if (!this.isAuthenticated) {
      console.error('Not authenticated');
      return;
    }

    this.send('driver_status_update', {
      status,
      latitude,
      longitude,
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.currentBookingId) {
      this.leaveBooking(this.currentBookingId);
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isAuthenticated = false;
    this.authToken = null;
    this.messageHandlers.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }
}

// Singleton instance
let wsInstance: WebSocketService | null = null;

export function getWebSocketService(): WebSocketService {
  if (!wsInstance) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    wsInstance = new WebSocketService(wsUrl);
  }
  return wsInstance;
}
