import React from 'react'
import { Navigate } from 'react-router-dom'
import { authService } from '../services/authService'

type Props = {
  children: React.ReactElement
  allowedRoles?: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const isAuth = authService.isAuthenticated()
  const user = authService.getStoredUser()

  if (!isAuth || !user) {
    // not authenticated -> redirect to login
    return <Navigate to="/" replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = (user as { role?: string } | null)?.role || null
    if (!role || !allowedRoles.includes(role)) {
      // authenticated but not authorized -> redirect to dashboard
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
