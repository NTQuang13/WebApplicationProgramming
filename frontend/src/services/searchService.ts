import { api } from '@/services/api'

/** Khớp với `searchCVs` trong backend (`cvController.js`). */
export type CVSearchHit = {
  cvId: string
  userId: string
  fileName: string
  createdAt: string
  score: number | null | undefined
  highlights: string[]
}

export type CVSearchResponse = {
  data: CVSearchHit[]
  total: number
  page: number
  limit: number
  latencyMs: number
}

export type CVSearchParams = {
  q: string
  page?: number
  limit?: number
}

export const searchService = {
  searchCVs: (params: CVSearchParams) => {
    const q = params.q.trim()
    const page = params.page ?? 1
    const limit = params.limit ?? 10

    return api.get<CVSearchResponse>('/api/cvs/search', {
      params: { q, page, limit },
      headers: { 'x-skip-error-toast': 'true' },
    })
  },
}
