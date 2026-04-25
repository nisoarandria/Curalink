export type UserType = "MEDECIN" | "PATIENT" | "NUTRITIONNISTE" | "ADMIN";

export interface AuthUser {
  id: number | string;
  email: string;
  userType: UserType;
  nom?: string;
  prenom?: string;
  isFirstConnexion?: boolean;
}

export interface LoginResponse {
  accessToken?: string;
  tokenType?: string;
  expiresAt?: string;
  user?: AuthUser;
}

const STORAGE_KEYS = {
  token: "auth_token",
  tokenType: "auth_token_type",
  expiresAt: "auth_expires_at",
  user: "auth_user",
} as const;

export function persistAuthSession(payload: LoginResponse): void {
  if (payload.accessToken)
    localStorage.setItem(STORAGE_KEYS.token, payload.accessToken);
  if (payload.tokenType)
    localStorage.setItem(STORAGE_KEYS.tokenType, payload.tokenType);
  if (payload.expiresAt)
    localStorage.setItem(STORAGE_KEYS.expiresAt, payload.expiresAt);
  if (payload.user)
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(payload.user));
}

export function clearAuthSession(): void {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.tokenType);
  localStorage.removeItem(STORAGE_KEYS.expiresAt);
  localStorage.removeItem(STORAGE_KEYS.user);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.token);
}

export function getCurrentUser(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getDefaultPathByRole(userType?: string): string {
  switch (userType) {
    case "ADMIN":
      return "/admin";
    case "MEDECIN":
      return "/medecin";
    case "NUTRITIONNISTE":
      return "/nutritionniste";
    case "PATIENT":
    default:
      return "/patient";
  }
}
