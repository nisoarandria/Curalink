import { apiClient } from "./axiosInstance";

export type NotificationLabel =
  | "DEMANDE_RDV"
  | "PROPOSITION_DATE"
  | "CONFIRMATION_RDV"
  | "REFUS_RDV"
  | "ANNULATION_RDV"
  | "TERMINAISON_RDV"
  | "ABSENCE_PATIENT"
  | "CHANGEMENT_STATUT";

export type NotificationItem = {
  id: number;
  rendezVousId: number;
  message: string;
  dateHeure: string;
  label: NotificationLabel;
  lu: boolean;
  createdAt: string;
};

export type NotificationPage = {
  content: NotificationItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export function getNotificationApiBaseUrl(): string {
  const base = apiClient.defaults.baseURL ?? "http://localhost:8080/api";
  return base.replace(/\/$/, "");
}

export async function fetchMyNotifications(
  page = 0,
  size = 20,
): Promise<NotificationPage> {
  const { data } = await apiClient.get<NotificationPage>("/notifications/me", {
    params: { page, size },
  });
  return data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ nonLues: number }>(
    "/notifications/me/non-lues",
  );
  return data.nonLues;
}

export async function markNotificationRead(id: number): Promise<NotificationItem> {
  const { data } = await apiClient.patch<NotificationItem>(
    `/notifications/${id}/lu`,
  );
  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch("/notifications/me/lire-tout");
}

export function buildNotificationStreamUrl(accessToken: string): string {
  const base = getNotificationApiBaseUrl();
  const token = encodeURIComponent(accessToken);
  return `${base}/notifications/me/stream?access_token=${token}`;
}
