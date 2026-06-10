import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import {
  buildNotificationStreamUrl,
  fetchMyNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/services/notificationApi";

type UseNotificationStreamOptions = {
  enabled: boolean;
};

const MIN_RECONNECT_MS = 1_000;
const MAX_RECONNECT_MS = 30_000;

function nextReconnectDelay(attempt: number): number {
  const exponential = MIN_RECONNECT_MS * 2 ** attempt;
  const capped = Math.min(exponential, MAX_RECONNECT_MS);
  const jitter = Math.random() * capped * 0.2;
  return Math.round(capped + jitter);
}

export function useNotificationStream({ enabled }: UseNotificationStreamOptions) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !getAccessToken()) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const [page, count] = await Promise.all([
        fetchMyNotifications(0, 20),
        fetchUnreadCount(),
      ]);
      setNotifications(page.content ?? []);
      setUnreadCount(count);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      sourceRef.current?.close();
      sourceRef.current = null;
      setConnected(false);
      return;
    }

    let cancelled = false;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;
    let source: EventSource | null = null;

    const clearReconnectTimer = () => {
      if (reconnectTimeout !== null) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };

    const closeSource = () => {
      if (source) {
        source.close();
        source = null;
        sourceRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      clearReconnectTimer();
      const delay = nextReconnectDelay(reconnectAttempt);
      reconnectAttempt += 1;
      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        connect();
      }, delay);
    };

    const connect = () => {
      if (cancelled) return;

      const token = getAccessToken();
      if (!token) {
        setConnected(false);
        return;
      }

      closeSource();
      source = new EventSource(buildNotificationStreamUrl(token));
      sourceRef.current = source;

      source.addEventListener("connected", () => {
        if (cancelled) return;
        const wasReconnect = reconnectAttempt > 0;
        reconnectAttempt = 0;
        setConnected(true);
        if (wasReconnect) {
          void refresh();
        }
      });

      source.addEventListener("notification", (event) => {
        try {
          const notification = JSON.parse(event.data) as NotificationItem;
          setNotifications((prev) => [
            notification,
            ...prev.filter((item) => item.id !== notification.id),
          ]);
          setUnreadCount((count) => count + 1);
        } catch {
          // ignore malformed payload
        }
      });

      source.onerror = () => {
        if (cancelled) return;
        setConnected(false);
        closeSource();
        scheduleReconnect();
      };
    };

    void refresh();
    connect();

    return () => {
      cancelled = true;
      clearReconnectTimer();
      closeSource();
      setConnected(false);
    };
  }, [enabled, refresh]);

  const markRead = useCallback(async (id: number) => {
    const updated = await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? updated : item)),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, lu: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    connected,
    loading,
    refresh,
    markRead,
    markAllRead,
  };
}
