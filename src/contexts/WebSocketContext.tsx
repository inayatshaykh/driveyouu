import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getWebSocketService } from '../services/websocket.service';

interface WebSocketContextType {
  isConnected: boolean;
  error: string | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  error: null,
});

export function useWebSocketContext() {
  return useContext(WebSocketContext);
}

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      return;
    }

    const ws = getWebSocketService();

    // Connect to WebSocket server
    ws.connect(token)
      .then(() => {
        setIsConnected(true);
        setError(null);
        console.log('✅ WebSocket connected successfully');
      })
      .catch((err) => {
        setError(err.message);
        setIsConnected(false);
        console.error('❌ WebSocket connection failed:', err);
      });

    // Cleanup on unmount
    return () => {
      // Keep connection alive, don't disconnect
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, error }}>
      {children}
    </WebSocketContext.Provider>
  );
}
