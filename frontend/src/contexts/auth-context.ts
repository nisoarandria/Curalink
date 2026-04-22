import { createContext } from "react"
import type { AuthUser, LoginResponse } from "@/lib/auth"

export type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (payload: LoginResponse) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
