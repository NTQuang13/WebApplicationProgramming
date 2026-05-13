import { api } from '@/services/api'
import type { Company } from '@/types'


export interface CompanyPayload {
  name: string
  description: string
  website?: string
}

export const companyService = {
  getCompanies: async (page = 1, limit = 20) => {
    const response = await api.get<{ companies: Company[] }>('/api/companies', {
      params: { page, limit },
    })
    return response.companies
  },
  getMyCompanies: async (page = 1, limit = 20) => {
    const response = await api.get<{ companies: Company[] }>('/api/companies/mine', {
      params: { page, limit },
    })
    return response.companies
  },
  getCompanyById: async (id: string) => {
    const response = await api.get<{ company: Company }>(`/api/companies/${id}`)
    return response.company
  },
  createCompany: async (data: CompanyPayload) => {
    const response = await api.post<{ company: Company }, CompanyPayload>('/api/companies', data)
    return response.company
  },
}
