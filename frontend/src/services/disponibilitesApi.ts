import { AxiosError } from "axios";
import { apiClient } from "./axiosInstance";
import type {
  DisponibiliteDetailResponse,
  UpsertDisponibiliteRequest,
} from "@/types/disponibilites";

const BASE_PATH = "/medecins/me/disponibilites";

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

export async function fetchMesDisponibilites() {
  const { data } = await apiClient.get<DisponibiliteDetailResponse[]>(BASE_PATH);
  return data;
}

export async function createDisponibilite(payload: UpsertDisponibiliteRequest) {
  const { data } = await apiClient.post<DisponibiliteDetailResponse>(
    BASE_PATH,
    payload,
  );
  return data;
}

export async function updateDisponibilite(
  id: number,
  payload: UpsertDisponibiliteRequest,
) {
  const { data } = await apiClient.put<DisponibiliteDetailResponse>(
    `${BASE_PATH}/${id}`,
    payload,
  );
  return data;
}

export async function deleteDisponibilite(id: number) {
  await apiClient.delete(`${BASE_PATH}/${id}`);
}

export function getDisponibiliteApiErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<ApiErrorPayload>;
  const status = axiosError?.response?.status;
  const apiMessage =
    axiosError?.response?.data?.message ?? axiosError?.response?.data?.error;

  if (status === 409) {
    return "Chevauchement détecté : ce créneau overlap avec une disponibilité existante.";
  }
  if (apiMessage) return apiMessage;
  return "Une erreur est survenue. Veuillez réessayer.";
}
