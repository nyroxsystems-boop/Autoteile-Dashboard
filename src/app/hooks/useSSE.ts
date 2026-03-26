/**
 * Server-Sent Events Hook
 * 
 * Connects to the SSE endpoint for real-time updates.
 * Auto-reconnects on disconnect. Invalidates API cache on relevant events.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface SSEEvent {
  type: string;
  tenantId: string;
  userId?: string;
  payload: Record<string, any>;
  timestamp: string;
}

export interface UseSSEOptions {
  /** JWT token for auth */
  token: string;
  /** Base URL of the bot-service */
  baseUrl: string;
  /** Called when ANY event is received */
  onEvent?: (event: SSEEvent) => void;
  /** Called when specific event types are received */
  onEventType?: Record<string, (event: SSEEvent) => void>;
  /** Enable/disable the connection */
  enabled?: boolean;
}

export interface UseSSEReturn {
  /** Whether SSE is currently connected */
  connected: boolean;
  /** Last received event */
  lastEvent: SSEEvent | null;
  /** Number of events received in this session */
  eventCount: number;
  /** Reconnect manually */
  reconnect: () => void;
  /** Disconnect */
  disconnect: () => void;
}

export function useSSE(options: UseSSEOptions): UseSSEReturn {
  const { token, baseUrl, onEvent, onEventType, enabled = true } = options;
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);

  const connect = useCallback(() => {
    if (!token || !baseUrl || !enabled) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `${baseUrl}/api/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url, { withCredentials: false });

    es.onopen = () => {
      setConnected(true);
      reconnectAttemptRef.current = 0;
    };

    es.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        setLastEvent(data);
        setEventCount(c => c + 1);

        // Call generic handler
        onEvent?.(data);

        // Call type-specific handler
        if (onEventType && data.type in onEventType) {
          onEventType[data.type](data);
        }
      } catch {
        // Ignore parse errors (heartbeat comments etc.)
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();

      // Exponential backoff reconnect (max 30s)
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
      reconnectAttemptRef.current++;

      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    eventSourceRef.current = es;
  }, [token, baseUrl, enabled, onEvent, onEventType]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    setConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptRef.current = 0;
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, token, baseUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    connected,
    lastEvent,
    eventCount,
    reconnect,
    disconnect,
  };
}
