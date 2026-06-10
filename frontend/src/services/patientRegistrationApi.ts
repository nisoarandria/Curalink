import { AxiosError } from "axios";
import { publicApiClient } from "./axiosInstance";
import type { LoginResponse } from "@/lib/auth";

export type PatientSexe = "MASCULIN" | "FEMININ" | "AUTRE";

export type PatientRegistrationPayload = {
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  sexe: PatientSexe;
  dateNaissance: string;
  email: string;
};

export type PatientRegistrationResponse = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  sexe: PatientSexe;
  dateNaissance: string;
};

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

export function mapFormSexe(value: string): PatientSexe {
  if (value === "F") return "FEMININ";
  if (value === "M") return "MASCULIN";
  return "AUTRE";
}

export async function registerPatient(payload: PatientRegistrationPayload) {
  const { data } = await publicApiClient.post<PatientRegistrationResponse>(
    "/patients/register",
    payload,
  );
  return data;
}

export async function setPatientPassword(payload: {
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const { data } = await publicApiClient.post<{
    message: string;
    patientId: number;
    email: string;
  }>("/patients/set-password", payload);
  return data;
}

export async function loginPatient(email: string, password: string) {
  const { data } = await publicApiClient.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function completePatientRegistration(payload: {
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  sexe: string;
  dateNaissance: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  await registerPatient({
    nom: payload.nom.trim(),
    prenom: payload.prenom.trim(),
    telephone: payload.telephone.trim(),
    adresse: payload.adresse.trim(),
    sexe: mapFormSexe(payload.sexe),
    dateNaissance: payload.dateNaissance,
    email: payload.email.trim(),
  });

  await setPatientPassword({
    email: payload.email.trim(),
    password: payload.password,
    confirmPassword: payload.confirmPassword,
  });

  return loginPatient(payload.email.trim(), payload.password);
}

export function getPatientRegistrationErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<ApiErrorPayload>;
  const apiMessage =
    axiosError?.response?.data?.message ?? axiosError?.response?.data?.error;

  if (apiMessage) return apiMessage;

  if (!axiosError?.response) {
    return "Impossible de contacter le serveur. Vérifiez que le backend est démarré.";
  }

  return "Une erreur est survenue lors de l'inscription.";
}
