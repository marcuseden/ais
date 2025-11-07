"use client"

import { useEffect, useState, useCallback } from 'react';
import { VesselPosition } from '@/lib/ais';

export function useSSE(url: string, enabled: boolean = true) {
  const [data, setData] = useState<VesselPosition | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let eventSource: EventSource | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource(url);

        eventSource.onopen = () => {
          console.log('SSE connected');
          setIsConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const vesselData = JSON.parse(event.data);
            setData(vesselData);
          } catch (err) {
            console.error('Failed to parse SSE message:', err);
          }
        };

        eventSource.onerror = (err) => {
          console.error('SSE error:', err);
          setIsConnected(false);
          setError(new Error('SSE connection error'));
          eventSource?.close();
          
          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            if (enabled) {
              connect();
            }
          }, 5000);
        };
      } catch (err) {
        setError(err as Error);
      }
    };

    connect();

    return () => {
      eventSource?.close();
      setIsConnected(false);
    };
  }, [url, enabled]);

  return { data, error, isConnected };
}

