import { useMemo, useState } from "react"
import {
  clearAuthSession,
  getAccessToken,
  getCurrentUser,
  persistAuthSession,
  type AuthUser,
} from "@/lib/auth"
import { AuthContext, type AuthContextValue } from "@/contexts/auth-context"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAccessToken())
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser())

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login: (payload) => {
        persistAuthSession(payload)
        setToken(payload.accessToken ?? null)
        setUser(payload.user ?? null)
      },
      logout: () => {
        clearAuthSession()
        setToken(null)
        setUser(null)
      },
    }),
    [token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
