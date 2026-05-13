import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { handleApiError } from '@/utils/errorHandler'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    serialize: (params) => {
      const searchParams = new URLSearchParams()

      Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return
        }

        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item !== undefined && item !== null && item !== '') {
              searchParams.append(key, String(item))
            }
          })
          return
        }

        searchParams.append(key, String(value))
      })

      return searchParams.toString()
    },
  },
})

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    const skipToast =
      typeof (error.config?.headers as any)?.['x-skip-error-toast'] !== 'undefined' ||
      typeof (error.config?.headers as any)?.['X-Skip-Error-Toast'] !== 'undefined'

    if (status === 401) {
      if (!skipToast) {
        handleApiError(error)
      }
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (status === 404) {
      console.error('API resource not found:', error.config?.url)
    }

    if (status && status >= 500) {
      console.error('Server error:', error.message)
    }

    if (!skipToast) {
      handleApiError(error)
    }
    return Promise.reject(error)
  },
)

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosClient.get<T>(url, config).then((response) => response.data),
  post: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
    axiosClient.post<T>(url, data, config).then((response) => response.data),
  put: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
    axiosClient.put<T>(url, data, config).then((response) => response.data),
  patch: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
    axiosClient.patch<T>(url, data, config).then((response) => response.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosClient.delete<T>(url, config).then((response) => response.data),
}

export default axiosClient
