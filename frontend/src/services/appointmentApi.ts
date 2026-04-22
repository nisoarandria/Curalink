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
