import { api } from './api'

export interface Category {
  id: string
  name: string
  description?: string
}

export interface ExperienceLevel {
  id: string
  name: string
  order: number
}

export const masterDataService = {
  getCategories: async () => {
    return await api.get<Category[]>('/api/categories')
  },
  getExperienceLevels: async () => {
    return await api.get<ExperienceLevel[]>('/api/experience-levels')
  },
}
