import { publicClient, apiClient } from "./axiosInstance";

// ── Types ────────────────────────────────────────────────────────────────

export type ServiceOption = {
  id: number;
  nom: string;
  description?: string;
  illustrationUrl?: string;
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

export type MedecinRendezVousResponse = RendezVousResponse & {
  specialite: string;
  adresseCabinet: string;
  numeroInscription: string;
};

export type StaffRole = "MEDECIN" | "NUTRITIONNISTE";

export type CreateStaffPayload = {
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresseCabinet: string;
  adresse?: string;
  role: StaffRole;
  numeroInscription?: string;
  serviceId?: number;
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

/** Liste paginée des RDV du médecin connecté */
export async function fetchMedecinRendezVous(params?: {
  page?: number;
  size?: number;
  q?: string;
  date?: string;
  month?: number;
}) {
  const { data } = await apiClient.get<
    PageResponse<MedecinRendezVousResponse>
  >("/rendezvous/medecin/me", { params });
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

/** Proposer le créneau demandé (MEDECIN, EN_ATTENTE → PROPOSE) */
export async function proposerRendezVous(id: number) {
  const { data } = await apiClient.patch<MedecinRendezVousResponse>(
    `/rendezvous/${id}/proposer`,
  );
  return data;
}

/** Proposer un nouveau créneau (MEDECIN) */
export async function proposerNouveauCreneau(id: number, dateHeure: string) {
  const { data } = await apiClient.patch<MedecinRendezVousResponse>(
    `/rendezvous/${id}/proposer-creneau`,
    { dateHeure },
  );
  return data;
}

/** Terminer un RDV confirmé (MEDECIN, CONFIRME → TERMINE) */
export async function terminerRendezVous(id: number) {
  const { data } = await apiClient.patch<MedecinRendezVousResponse>(
    `/rendezvous/${id}/terminer`,
  );
  return data;
}

/** Marquer le patient absent (MEDECIN, CONFIRME → ABSENT) */
export async function marquerAbsentRendezVous(id: number) {
  const { data } = await apiClient.patch<MedecinRendezVousResponse>(
    `/rendezvous/${id}/absent`,
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

/** Envoyer un message au chatbot médical IA (endpoint public) */
export async function sendChatMessage(message: string): Promise<string> {
  const { data } = await publicClient.post<string>(
    "/api/orientation/chat",
    { message },
    { responseType: "text" }
  );
  return data;
}

/** Créer un utilisateur staff (ADMIN) */
export async function createStaff(body: CreateStaffPayload) {
  const { data } = await apiClient.post("/admin/staff", body);
  return data;
}
