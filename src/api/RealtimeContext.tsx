import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { connectRealtime, type RealtimeEvent } from './realtime';
import { useAuth } from './AuthContext';

type Listener = (data: Record<string, unknown>) => void;

interface RealtimeState {
  subscribe: (event: string, listener: Listener) => () => void;
}

const RealtimeContext = createContext<RealtimeState | null>(null);

/** Opens one socket per logged-in session and fans events out to subscribers by name. */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const listenersRef = useRef<Map<string, Set<Listener>>>(new Map());

  useEffect(() => {
    if (!user) return;
    return connectRealtime((event: RealtimeEvent) => {
      listenersRef.current.get(event.event)?.forEach((listener) => listener(event.data));
    });
    // Reconnect only on an actual login/logout, not on in-place profile edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function subscribe(event: string, listener: Listener) {
    let listeners = listenersRef.current.get(event);
    if (!listeners) {
      listeners = new Set();
      listenersRef.current.set(event, listeners);
    }
    listeners.add(listener);
    return () => listeners!.delete(listener);
  }

  return <RealtimeContext.Provider value={{ subscribe }}>{children}</RealtimeContext.Provider>;
}

/** Runs `handler` whenever a realtime event named `event` arrives. See docs/REALTIME.md for the event list. */
export function useRealtimeEvent(event: string, handler: Listener) {
  const ctx = useContext(RealtimeContext);
  useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe(event, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, event]);
}
