import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketService } from '../services/websocket.service';

type MessageHandler = (payload: any) => void;

export function useWebSocket() {
  const ws = useRef(getWebSocketService());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    
    if (token && !ws.current.isConnected()) {
      ws.current
        .connect(token)
        .then(() => {
          setIsConnected(true);
          setError(null);
        })
        .catch((err) => {
          setError(err.message);
          setIsConnected(false);
        });
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, []);

  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    ws.current.on(type, handler);
    return () => ws.current.off(type, handler);
  }, []);

  const joinBooking = useCallback((bookingId: string) => {
    ws.current.joinBooking(bookingId);
  }, []);

  const leaveBooking = useCallback((bookingId: string) => {
    ws.current.leaveBooking(bookingId);
  }, []);

  const updateLocation = useCallback(
    (bookingId: string, latitude: number, longitude: number, heading?: number, speed?: number) => {
      ws.current.updateLocation(bookingId, latitude, longitude, heading, speed);
    },
    []
  );

  const updateBookingStatus = useCallback((bookingId: string, status: string, data?: any) => {
    ws.current.updateBookingStatus(bookingId, status, data);
  }, []);

  const updateDriverStatus = useCallback((status: string, latitude?: number, longitude?: number) => {
    ws.current.updateDriverStatus(status, latitude, longitude);
  }, []);

  return {
    isConnected,
    error,
    subscribe,
    joinBooking,
    leaveBooking,
    updateLocation,
    updateBookingStatus,
    updateDriverStatus,
  };
}

/**
 * Hook for tracking a specific booking
 */
export function useBookingTracking(bookingId: string | null) {
  const { isConnected, subscribe, joinBooking, leaveBooking } = useWebSocket();
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    timestamp: string;
  } | null>(null);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId || !isConnected) return;

    // Join booking room
    joinBooking(bookingId);

    // Subscribe to location updates
    const unsubscribeLocation = subscribe('location_update', (payload) => {
      if (payload.bookingId === bookingId) {
        setDriverLocation({
          latitude: payload.latitude,
          longitude: payload.longitude,
          heading: payload.heading,
          speed: payload.speed,
          timestamp: payload.timestamp,
        });
      }
    });

    // Subscribe to status updates
    const unsubscribeStatus = subscribe('booking_status_update', (payload) => {
      if (payload.bookingId === bookingId) {
        setBookingStatus(payload.status);
      }
    });

    return () => {
      leaveBooking(bookingId);
      unsubscribeLocation();
      unsubscribeStatus();
    };
  }, [bookingId, isConnected, subscribe, joinBooking, leaveBooking]);

  return {
    driverLocation,
    bookingStatus,
    isConnected,
  };
}

/**
 * Hook for driver location updates
 */
export function useDriverLocationUpdates(bookingId: string | null) {
  const { isConnected, updateLocation } = useWebSocket();
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    if (!bookingId || !isConnected || !navigator.geolocation) {
      console.error('Cannot start tracking: missing requirements');
      return;
    }

    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed } = position.coords;
        updateLocation(
          bookingId,
          latitude,
          longitude,
          heading || undefined,
          speed || undefined
        );
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );
  }, [bookingId, isConnected, updateLocation]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    isTracking,
    startTracking,
    stopTracking,
  };
}
