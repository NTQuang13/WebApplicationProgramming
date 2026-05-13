export interface Job {
  id: string
  title: string
  companyId?: string
  companyName: string
  location: string
  salaryMin?: number
  salaryMax?: number
  jobTypeId: string
  jobTypeName?: string
  experienceLevelId: string
  experienceLevelName?: string
  description: string
  requirements: string[] | string
  createdAt: string
  createdBy?: string
}

export interface JobPayload {
  title: string
  location: string
  salaryMin: number
  salaryMax: number
  jobTypeId: string
  experienceLevelId: string
  companyId: string
  description: string
  requirements: string
}

export interface JobFilter {
  q?: string
  location?: string
  jobTypeId?: string
  experienceLevelId?: string
  companyId?: string
  createdBy?: string
  expectedSalary?: number
  page?: number
  limit?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

export type PaginatedJobsResponse = PaginatedResponse<Job>
