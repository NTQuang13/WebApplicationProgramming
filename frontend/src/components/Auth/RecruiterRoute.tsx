import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface RecruiterRouteProps {
  children: ReactNode
}

function RecruiterRoute({ children }: RecruiterRouteProps) {
  const user = useAuthStore((state) => state.user)

  if (user?.role !== 'recruiter') {
    return <Navigate to="/jobs" replace />
  }

  return children
}

export default RecruiterRoute
