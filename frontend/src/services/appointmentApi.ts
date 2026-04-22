import { publicClient, apiClient } from "./axiosInstance";

// ── Types ────────────────────────────────────────────────────────────────

export type ServiceOption = {
  id: number;
  nom: string;
};

export type MedecinOption = {
  id: number;
  nom: string;
  specialite: string;
};

export type MedecinDisponibilite = {
  date: string;  // "YYYY-MM-DD"
  heure: string; // "HH:mm"
};

export type ServiceDisponibilite = {
  medecinId: number;
  medecinNom: string;
  heure: string; // "HH:mm"
};

export type RendezVousStatus =
  | "EN_ATTENTE"
  | "PROPOSE"
  | "CONFIRME"
  | "REFUSE"
  | "ANNULE"
  | "TERMINE"
  | "ABSENT";

export type RendezVousResponse = {
  id: number;
  dateHeure: string;
  status: RendezVousStatus;
  serviceId: number;
  serviceNom: string;
  patientId: number;
  patientNomComplet: string;
  medecinId: number;
  medecinNomComplet: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

// ── Appels API ───────────────────────────────────────────────────────────

/** Liste des services disponibles */
export async function fetchServices() {
  const { data } = await publicClient.get<ServiceOption[]>("/services");
  return data;
}

/** Médecins rattachés à un service */
export async function fetchMedecinsByService(serviceId: number) {
  const { data } = await publicClient.get<MedecinOption[]>(
    `/services/${serviceId}/medecins`
  );
  return data;
}

/** Créneaux disponibles d'un médecin */
export async function fetchMedecinDisponibilites(medecinId: number) {
  const { data } = await publicClient.get<MedecinDisponibilite[]>(
    `/medecins/${medecinId}/disponibilites`
  );
  return data;
}

/** Créneaux rapides par service et date */
export async function fetchServiceDisponibilites(
  serviceId: number,
  date: string
) {
  const { data } = await publicClient.get<ServiceDisponibilite[]>(
    `/services/${serviceId}/disponibilites`,
    { params: { date } }
  );
  return data;
}

/** Liste paginée des RDV du patient connecté */
export async function fetchMyRendezVous(params?: {
  page?: number;
  size?: number;
  q?: string;
  date?: string;
}) {
  const { data } = await apiClient.get<PageResponse<RendezVousResponse>>(
    "/patients/me/rendezvous",
    { params }
  );
  return data;
}

/** Annuler un RDV (PATIENT) */
export async function annulerRendezVous(id: number) {
  const { data } = await apiClient.patch<RendezVousResponse>(
    `/rendezvous/${id}/annuler`
  );
  return data;
}

/** Confirmer un RDV proposé (PATIENT) */
export async function confirmerRendezVous(id: number) {
  const { data } = await apiClient.patch<RendezVousResponse>(
    `/rendezvous/${id}/confirmer`
  );
  return data;
}

/** Refuser un RDV proposé (PATIENT) */
export async function refuserRendezVous(id: number) {
  const { data } = await apiClient.patch<RendezVousResponse>(
    `/rendezvous/${id}/refuser`
  );
  return data;
}

/** Créer une demande de rendez-vous (PATIENT authentifié) */
export async function createRendezVous(body: {
  dateHeure: string;
  serviceId: number;
  medecinId: number;
}) {
  const { data } = await apiClient.post<RendezVousResponse>(
    "/rendezvous",
    body
  );
  return data;
}
