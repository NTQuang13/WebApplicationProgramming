import { api } from '@/services/api'
import type { Job, JobFilter, JobPayload, PaginatedJobsResponse } from '@/types/job'

// Backend response shape từ getJobs
interface BackendJobsResponse {
  data: Job[]
  total: number
  page: number
  limit: number
}

function buildJobsQueryParams(filters: JobFilter) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 10
  const params: Record<string, string | number> = { page, limit }

  if (filters.q?.trim()) params.q = filters.q.trim()
  if (filters.location?.trim()) params.location = filters.location.trim()
  if (filters.jobTypeId) params.jobTypeId = filters.jobTypeId
  if (filters.experienceLevelId) params.experienceLevelId = filters.experienceLevelId
  if (filters.companyId) params.companyId = filters.companyId
  if (filters.createdBy) params.createdBy = filters.createdBy

  if (typeof filters.expectedSalary === 'number' && Number.isFinite(filters.expectedSalary)) {
    params.expectedSalary = filters.expectedSalary
  }

  return params
}

export const jobService = {
  getJobs: (filters: JobFilter): Promise<PaginatedJobsResponse> => {
    const params = buildJobsQueryParams(filters)
    return api
      .get<BackendJobsResponse>('/api/jobs', {
        params,
      })
      .then((res) => {
        const total = res.total ?? 0
        const limit = Number(res.limit ?? params.limit ?? 10)
        const page = Number(res.page ?? params.page ?? 1)

        return {
          data: res.data ?? [],
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / Math.max(1, limit))),
          },
        }
      })
  },
  getJobById: (id: string) => api.get<{ job: Job }>(`/api/jobs/${id}`).then((res) => res.job),
  createJob: (data: JobPayload) => api.post<{ message: string; jobId: string }, JobPayload>('/api/jobs', data),
  updateJob: (id: string, data: JobPayload) => api.put<{ message: string }, JobPayload>(`/api/jobs/${id}`, data),
  deleteJob: (id: string) => api.delete<{ message: string }>(`/api/jobs/${id}`),
}
