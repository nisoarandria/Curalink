import axios from "axios";
import { getAccessToken } from "@/lib/auth";

const env = import.meta.env as Record<string, string | undefined>;
const baseURL =
  env.VITE_BACKEND_URL ?? env.BACKEND_URL ?? "http://localhost:8080/api";

// Base URL sans le préfixe /api — pour les endpoints publics (/services, /medecins, etc.)
const publicBaseURL = baseURL.replace(/\/api\/?$/, "");

// 1. Variante simple (JSON par défaut)
export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token Bearer à chaque requête
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 2. Variante pour l'upload de fichiers (multipart/form-data)
export const apiClientMultipart = axios.create({
  baseURL,
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

// Intercepteur pour le multipart
apiClientMultipart.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 3. Client public (sans /api) pour les endpoints ouverts
export const publicClient = axios.create({
  baseURL: publicBaseURL,
  headers: { "Content-Type": "application/json" },
});

export async function logoutRequest() {
  return apiClient.post("/auth/logout");
}
