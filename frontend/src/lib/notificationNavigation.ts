import type { NotificationItem } from "@/services/notificationApi";

export function getNotificationDate(item: NotificationItem): string {
  const datePart = item.dateHeure.split("T")[0];
  if (datePart) return datePart;
  const parsed = new Date(item.dateHeure);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}
