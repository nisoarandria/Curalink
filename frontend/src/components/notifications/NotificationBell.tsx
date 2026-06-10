import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, Notification01Icon } from "@/components/ui/icon";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import type { NotificationItem } from "@/services/notificationApi";

type NotificationBellProps = {
  enabled: boolean;
  onNotificationClick?: (item: NotificationItem) => void;
};

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotificationRow({
  item,
  onMarkRead,
  onClick,
}: {
  item: NotificationItem;
  onMarkRead: (id: number) => void;
  onClick?: (item: NotificationItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!item.lu) onMarkRead(item.id);
        onClick?.(item);
      }}
      className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${
        item.lu ? "bg-transparent" : "bg-primary/5 hover:bg-primary/10"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
          {item.label}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {formatCreatedAt(item.createdAt)}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{item.message}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        RDV :{" "}
        {new Date(item.dateHeure).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </button>
  );
}

export function NotificationBell({
  enabled,
  onNotificationClick,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const {
    notifications,
    unreadCount,
    connected,
    loading,
    markRead,
    markAllRead,
    refresh,
  } = useNotificationStream({ enabled });

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      void refresh();
    }
  }, [open, refresh]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full bg-white shadow-sm h-11 w-11 relative"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
      >
        <Icon icon={Notification01Icon} className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <span
          className={`absolute bottom-1 right-1 h-2 w-2 rounded-full border border-white ${
            connected ? "bg-emerald-500" : "bg-slate-300"
          }`}
          title={connected ? "Flux temps réel actif" : "Flux temps réel déconnecté"}
        />
      </Button>

      {open && (
        <div className="absolute right-0 mt-3 w-[min(92vw,360px)] rounded-2xl border border-border/60 bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div>
              <p className="text-sm font-bold">Notifications</p>
              <p className="text-[11px] text-muted-foreground">
                {connected ? "Temps réel actif" : "Reconnexion en cours..."}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Tout lire
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <p className="px-3 py-6 text-sm text-muted-foreground text-center">
                Chargement...
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted-foreground text-center">
                Aucune notification pour le moment.
              </p>
            ) : (
              notifications.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onMarkRead={(id) => void markRead(id)}
                  onClick={(notification) => {
                    onNotificationClick?.(notification);
                    setOpen(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
