import { Navigate, Outlet } from "react-router-dom"
import { getDefaultPathByRole } from "@/lib/auth"
import { useAuth } from "@/hooks/useAuth"

type ProtectedRouteProps = {
  allowedRoles?: string[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { token, user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !token || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.userType)) {
    return <Navigate to={getDefaultPathByRole(user.userType)} replace />
  }

  return <Outlet />
}
