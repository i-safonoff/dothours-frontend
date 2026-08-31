import { getToken } from './client';

export interface RealtimeEvent {
  event: string;
  data: Record<string, unknown>;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';
const WS_URL = API_URL.replace(/^http/, 'ws');

const MAX_RETRY_DELAY_MS = 30000;
const INITIAL_RETRY_DELAY_MS = 1000;

/**
 * Opens the realtime socket and reconnects with backoff on drop. Returns a
 * disposer — call it to close the connection for good (e.g. on logout).
 *
 * Events are hints, not data (see the backend's docs/REALTIME.md): the
 * payload only ever carries ids, so a dropped or duplicated frame just means
 * one extra re-fetch, never a wrong screen.
 */
export function connectRealtime(onEvent: (event: RealtimeEvent) => void): () => void {
  const token = getToken();
  if (!token) return () => {};

  let socket: WebSocket | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryDelay = INITIAL_RETRY_DELAY_MS;
  let disposed = false;

  function connect() {
    socket = new WebSocket(`${WS_URL}/ws?token=${encodeURIComponent(token!)}`);

    socket.onopen = () => {
      retryDelay = INITIAL_RETRY_DELAY_MS;
    };

    socket.onmessage = (message) => {
      try {
        const parsed = JSON.parse(message.data) as RealtimeEvent;
        if (parsed.event !== 'pong') onEvent(parsed);
      } catch {
        // Malformed frame — ignore it, the next one will be fine.
      }
    };

    socket.onclose = () => {
      if (disposed) return;
      retryTimer = setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
    };

    socket.onerror = () => socket?.close();
  }

  connect();

  return () => {
    disposed = true;
    if (retryTimer) clearTimeout(retryTimer);
    socket?.close();
  };
}
