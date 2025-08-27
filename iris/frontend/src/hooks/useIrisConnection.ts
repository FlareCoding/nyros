import { useEffect, useState, useRef } from 'react';
import { useEventStore } from '../stores/eventStore';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useIrisConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [eventCount, setEventCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const addEvent = useEventStore(state => state.addEvent);

  useEffect(() => {
    // Connect to backend WebSocket server
    const ws = new WebSocket('ws://localhost:3001/ws');
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => {
      console.log('[IRIS] Connected to backend');
      setStatus('connected');
    };

    ws.onclose = () => {
      console.log('[IRIS] Disconnected from backend');
      setStatus('disconnected');
    };

    ws.onerror = (error) => {
      console.error('[IRIS] Connection error:', error);
      setStatus('error');
    };

    ws.onmessage = async (event) => {
      try {
        // Handle both Blob and string data
        let messageText: string;
        if (event.data instanceof Blob) {
          messageText = await event.data.text();
        } else {
          messageText = event.data;
        }

        const message = JSON.parse(messageText);
        console.log('[IRIS] Received message:', message.type);

        switch (message.type) {
          case 'welcome':
            console.log('[IRIS] Welcome message:', message.data);
            break;

          case 'event':
            // Add single event to store
            addEvent(message.data);
            setEventCount(prev => prev + 1);
            break;

          case 'batch':
            // Add multiple events
            if (Array.isArray(message.data)) {
              message.data.forEach(addEvent);
              setEventCount(prev => prev + message.data.length);
            }
            break;

          case 'stats':
            console.log('[IRIS] Stats update:', message.data);
            break;

          default:
            console.warn('[IRIS] Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('[IRIS] Failed to parse message:', error);
      }
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [addEvent]);

  return { status, socket: wsRef.current, eventCount };
}
