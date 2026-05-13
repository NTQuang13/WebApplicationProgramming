import type { LoadingSpinnerProps } from '../../types'
import { Loader2 } from 'lucide-react'

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
}

function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={`${sizeClasses[size]} animate-spin text-brand-600`}
      aria-label="Loading"
      role="status"
    />
  )
}

export default LoadingSpinner
