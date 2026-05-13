import { api } from '@/services/api'
import { userService } from './userService'
import type { User, UserRole } from '../types'

interface SigninPayload {
  email: string
  password: string
}

interface SignupPayload extends SigninPayload {
  name: string
  role: UserRole
}

export interface AuthResponse {
  user: User
  token: string
}

export const authService = {
  signin: async (payload: SigninPayload): Promise<AuthResponse> => {
    // 1. Gọi endpoint signin -> backend trả { accessToken, message }
    const response = await api.post<{ accessToken: string; message: string }>('/api/auth/signin', payload)
    const token = response.accessToken

    // 2. Tạm lưu token để call tiếp theo có auth header
    localStorage.setItem('token', token)

    // 3. Lấy thông tin user từ /api/users/me
    const user = await userService.getMe()

    return { token, user }
  },

  signup: async (payload: SignupPayload): Promise<void> => {
    // Backend trả { user, token } nhưng ta chỉ redirect về login
    await api.post<{ user: User; token: string }, SignupPayload>('/api/auth/signup', payload)
  },

  signout: async (): Promise<void> => {
    try {
      await api.post('/api/auth/signout', {})
    } catch {
      // Bỏ qua lỗi - vẫn xoá local state
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },
}
