import { apiClient, apiClientMultipart } from "./axiosInstance";
import type { PageResponse } from "./appointmentApi";

export type MedecinPatientSummary = {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  dateNaissance: string;
  sexe: "MASCULIN" | "FEMININ" | "AUTRE";
};

export type AntecedentResponse = {
  id: number;
  patientId: number;
  description: string;
  createdAt: string;
};

export type ConstanteVitaleResponse = {
  id: number;
  patientId: number;
  date: string;
  glycemie?: number | null;
  tension?: string | null;
  poids?: number | null;
  imc?: number | null;
};

export type ConsultationResponse = {
  id: number;
  rendezVousId: number;
  patientId: number;
  medecinId: number;
  motif: string;
  diagnostic: string;
  date: string;
};

export async function fetchMedecinPatientDetail(patientId: number) {
  const { data } = await apiClient.get<MedecinPatientSummary>(
    `/medecins/me/patients/${patientId}`,
  );
  return data;
}

export async function fetchMedecinPatients(params?: {
  page?: number;
  size?: number;
  q?: string;
}) {
  const { data } = await apiClient.get<PageResponse<MedecinPatientSummary>>(
    "/medecins/me/patients",
    { params },
  );
  return data;
}

export async function fetchPatientAntecedents(patientId: number) {
  const { data } = await apiClient.get<AntecedentResponse[]>(
    `/medecins/me/patients/${patientId}/antecedents`,
  );
  return data;
}

export async function createPatientAntecedent(
  patientId: number,
  description: string,
) {
  const { data } = await apiClient.post<AntecedentResponse>(
    `/patients/${patientId}/antecedents`,
    { description },
  );
  return data;
}

export async function fetchPatientConstantes(patientId: number) {
  const { data } = await apiClient.get<ConstanteVitaleResponse[]>(
    `/medecins/me/patients/${patientId}/constantes`,
  );
  return data;
}

export async function createPatientConstante(
  patientId: number,
  body: {
    date: string;
    glycemie?: number;
    tension?: string;
    poids?: number;
    imc?: number;
  },
) {
  const { data } = await apiClient.post<ConstanteVitaleResponse>(
    `/${patientId}/constantes`,
    body,
  );
  return data;
}

export async function fetchPatientConsultations(patientId: number) {
  const { data } = await apiClient.get<ConsultationResponse[]>(
    `/medecins/me/patients/${patientId}/consultations`,
  );
  return data;
}

export async function createConsultation(body: {
  rendezVousId: number;
  patientId: number;
  medecinId: number;
  motif: string;
  diagnostic: string;
  date: string;
}) {
  const { data } = await apiClient.post<ConsultationResponse>(
    "/consultations",
    body,
  );
  return data;
}

export type OrdonnanceResponse = {
  id: number;
  consultationId: number;
  createdAt: string;
  message: string;
};

export async function createOrdonnance(
  consultationId: number,
  pdfBlob: Blob,
  filename = `ordonnance-${consultationId}.pdf`,
) {
  const formData = new FormData();
  formData.append("pdfContent", pdfBlob, filename);
  const { data } = await apiClientMultipart.post<OrdonnanceResponse>(
    `/consultations/${consultationId}/ordonnance`,
    formData,
  );
  return data;
}

export function mapSexeToDisplay(sexe: MedecinPatientSummary["sexe"]) {
  if (sexe === "FEMININ") return "F";
  if (sexe === "MASCULIN") return "M";
  return "AUTRE";
}

export function mapAntecedentToMedicalHistory(item: AntecedentResponse) {
  return {
    id: String(item.id),
    label: item.description,
  };
}

export function mapConstanteToVitalSign(item: ConstanteVitaleResponse) {
  return {
    id: String(item.id),
    date: item.date,
    tension: item.tension ?? "",
    glycemie: item.glycemie != null ? String(item.glycemie) : "",
    poids: item.poids != null ? String(item.poids) : "",
    imc: item.imc != null ? String(item.imc) : "",
  };
}

export function buildPatientRecord(
  summary: MedecinPatientSummary,
  antecedents: AntecedentResponse[],
  constantes: ConstanteVitaleResponse[],
  consultations: ConsultationResponse[],
) {
  return {
    id: String(summary.id),
    nom: summary.nom,
    prenom: summary.prenom,
    sexe: mapSexeToDisplay(summary.sexe),
    dateNaissance: summary.dateNaissance,
    numeroDossier: `PAT-${summary.id}`,
    contact: summary.telephone,
    adresse: summary.adresse,
    antecedents: antecedents.map(mapAntecedentToMedicalHistory),
    constantes: constantes.map(mapConstanteToVitalSign),
    historiqueConsultations: consultations.map((item) => ({
      id: String(item.id),
      rendezVousId: String(item.rendezVousId),
      date: item.date,
      motif: item.motif,
      diagnostic: item.diagnostic,
    })),
  };
}
