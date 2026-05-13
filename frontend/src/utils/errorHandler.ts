import { toast } from 'sonner'

const statusMessageMap: Record<number, string> = {
  400: 'Invalid request',
  401: 'Please login again',
  403: "You don't have permission",
  404: 'Resource not found',
  500: 'Server error, please try again',
}

export function handleApiError(error: unknown) {
  const anyError = error as { response?: { status?: number } } | undefined
  const status = anyError?.response?.status

  const message =
    typeof status === 'number'
      ? statusMessageMap[status] ?? (status >= 500 ? statusMessageMap[500] : 'Something went wrong')
      : 'Network error, please try again'

  toast.error(message)
  return message
}

