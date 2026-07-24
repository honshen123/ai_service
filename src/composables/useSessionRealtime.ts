import { onUnmounted, ref } from 'vue';
import { fetchWsTicket, resolveWsUrl, type RealtimeEnvelope } from '@/api/realtime';

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseSessionRealtimeOptions {
  onEvent: (envelope: RealtimeEnvelope) => void;
  autoReconnect?: boolean;
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
}

export function useSessionRealtime(options: UseSessionRealtimeOptions) {
  const status = ref<RealtimeStatus>('idle');
  const subscribedSessionId = ref(0);

  let socket: UniApp.SocketTask | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let manualClose = false;
  let reconnectAttempts = 0;

  const autoReconnect = options.autoReconnect !== false;
  const reconnectDelayMs = options.reconnectDelayMs ?? 3000;
  const maxReconnectAttempts = options.maxReconnectAttempts ?? 8;
  const wsEnabled = (import.meta.env.VITE_WS_ENABLED as string | undefined) !== 'false';

  function clearTimers() {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function send(payload: Record<string, unknown>) {
    if (!socket) return;
    socket.send({
      data: JSON.stringify(payload),
      fail: () => {},
    });
  }

  function startPing() {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = setInterval(() => {
      send({ event: 'ping' });
    }, 25000);
  }

  function scheduleReconnect() {
    if (!autoReconnect || manualClose || reconnectTimer) return;
    if (reconnectAttempts >= maxReconnectAttempts) {
      status.value = 'error';
      return;
    }
    reconnectAttempts += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, reconnectDelayMs);
  }

  function handleMessage(raw: string) {
    let envelope: RealtimeEnvelope;
    try {
      envelope = JSON.parse(raw) as RealtimeEnvelope;
    } catch {
      return;
    }
    options.onEvent(envelope);
  }

  async function connect() {
    if (!wsEnabled) {
      status.value = 'idle';
      return;
    }

    manualClose = false;
    clearTimers();
    status.value = 'connecting';

    try {
      const ticket = await fetchWsTicket();
      const url = resolveWsUrl(ticket);

      if (socket) {
        try {
          socket.close({});
        } catch {
          // ignore
        }
        socket = null;
      }

      socket = uni.connectSocket({
        url,
        complete: () => {},
      });

      socket.onOpen(() => {
        reconnectAttempts = 0;
        status.value = 'connected';
        startPing();
        if (subscribedSessionId.value > 0) {
          send({ event: 'session.subscribe', session_id: subscribedSessionId.value });
        }
      });

      socket.onMessage((res) => {
        if (typeof res.data === 'string') {
          handleMessage(res.data);
        }
      });

      socket.onError(() => {
        status.value = 'error';
      });

      socket.onClose(() => {
        clearTimers();
        socket = null;
        if (!manualClose) {
          status.value = 'disconnected';
          scheduleReconnect();
        } else {
          status.value = 'idle';
        }
      });
    } catch {
      status.value = 'error';
      scheduleReconnect();
    }
  }

  function subscribeSession(sessionId: number) {
    if (sessionId <= 0) return;

    if (subscribedSessionId.value > 0 && subscribedSessionId.value !== sessionId) {
      send({ event: 'session.unsubscribe', session_id: subscribedSessionId.value });
    }

    subscribedSessionId.value = sessionId;
    if (status.value === 'connected') {
      send({ event: 'session.subscribe', session_id: sessionId });
    }
  }

  function disconnect() {
    manualClose = true;
    reconnectAttempts = 0;
    clearTimers();
    if (subscribedSessionId.value > 0) {
      send({ event: 'session.unsubscribe', session_id: subscribedSessionId.value });
      subscribedSessionId.value = 0;
    }
    try {
      socket?.close({});
    } catch {
      // ignore
    }
    socket = null;
    status.value = 'idle';
  }

  onUnmounted(() => {
    disconnect();
  });

  return {
    status,
    subscribedSessionId,
    connect,
    subscribeSession,
    disconnect,
  };
}
