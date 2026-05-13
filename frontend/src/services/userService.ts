import { api } from '@/services/api'
import type { User } from '@/types'

export interface UpdateProfilePayload {
  name: string
  phone?: string
}

export interface ChangePasswordPayload {
  oldPassword: string
  newPassword: string
  confirmPassword?: string
}

export const userService = {
  getMe: () => api.get<User>('/api/users/me'),
  updateProfile: async (data: UpdateProfilePayload) => {
    const response = await api.put<{ message: string; user: User }, UpdateProfilePayload>('/api/users/me', data)
    return response.user
  },
  changePassword: (data: ChangePasswordPayload) => api.put<{ message: string }, ChangePasswordPayload>('/api/users/password', data),
}
