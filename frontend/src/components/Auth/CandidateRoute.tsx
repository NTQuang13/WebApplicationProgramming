import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface CandidateRouteProps {
  children: ReactNode
}

function CandidateRoute({ children }: CandidateRouteProps) {
  const user = useAuthStore((state) => state.user)

  if (user?.role !== 'candidate') {
    return <Navigate to="/jobs" replace />
  }

  return children
}

export default CandidateRoute
