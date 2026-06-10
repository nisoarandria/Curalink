import { apiClient } from "./axiosInstance";
import type { PageResponse } from "./appointmentApi";
import type {
  AntecedentResponse,
  ConstanteVitaleResponse,
  ConsultationResponse,
} from "./medecinPatientApi";
import {
  mapAntecedentToMedicalHistory,
  mapConstanteToVitalSign,
} from "./medecinPatientApi";

export type PatientProfileResponse = {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  dateNaissance: string;
  sexe: string;
};

export type PatientOrdonnanceResponse = {
  id: number;
  consultationId: number;
  rendezVousId: number;
  medecinId: number;
  medecinNomComplet: string;
  consultationDate: string;
  createdAt: string;
};

function mapPatientSexe(sexe: string) {
  if (sexe === "FEMININ" || sexe === "F") return "F";
  if (sexe === "MASCULIN" || sexe === "M") return "M";
  return "AUTRE";
}

export function buildMyPatientRecord(
  profile: PatientProfileResponse,
  antecedents: AntecedentResponse[],
  constantes: ConstanteVitaleResponse[],
  consultations: ConsultationResponse[],
) {
  return {
    id: String(profile.id),
    nom: profile.nom,
    prenom: profile.prenom,
    sexe: mapPatientSexe(profile.sexe),
    dateNaissance: profile.dateNaissance,
    numeroDossier: `PAT-${profile.id}`,
    contact: profile.telephone,
    adresse: profile.adresse,
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

export async function fetchMyPatientProfile() {
  const { data } = await apiClient.get<PatientProfileResponse>("/patients/me");
  return data;
}

export async function fetchMyAntecedents() {
  const { data } = await apiClient.get<AntecedentResponse[]>(
    "/patients/me/antecedents",
  );
  return data;
}

export async function fetchMyConstantes() {
  const { data } = await apiClient.get<ConstanteVitaleResponse[]>(
    "/patients/me/constantes",
  );
  return data;
}

export async function fetchMyConsultations() {
  const { data } = await apiClient.get<ConsultationResponse[]>(
    "/patients/me/consultations",
  );
  return data;
}

export async function fetchMyOrdonnances(params?: {
  page?: number;
  size?: number;
  q?: string;
  date?: string;
}) {
  const { data } = await apiClient.get<PageResponse<PatientOrdonnanceResponse>>(
    "/patients/me/ordonnances",
    { params },
  );
  return data;
}

export async function downloadMyOrdonnancePdf(id: number) {
  const { data } = await apiClient.get<Blob>(
    `/patients/me/ordonnances/${id}/pdf`,
    { responseType: "blob" },
  );
  return data;
}
