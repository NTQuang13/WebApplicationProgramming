import axiosClient, { api } from '@/services/api'

import type { AxiosError } from 'axios'
import type { Application } from '@/types'

export interface BackendListResponse<T> {
  data: T[]
  page: number
  limit: number
  total?: number
}

export const applicationService = {
  applyJob: (jobId: string, cvId: string) =>
    api.post<{ message: string; application: Application }, { jobId: string; cvId: string }>('/api/applications', {
      jobId,
      cvId,
    }),
  getApplications: (page = 1, limit = 10) =>
    api.get<BackendListResponse<Application>>('/api/applications', {
      params: { page, limit },
    }),
  updateApplicationStatus: (id: string, status: string) =>
    api.patch<{ message: string; applicationId: string; newStatus: string }, { status: string }>(
      `/api/applications/${id}/status`,
      { status }
    ),

  /** Chỉ recruiter; tải file CV cho đơn ứng tuyển của job họ tạo. */
  downloadApplicationCv: async (applicationId: string) => {
    try {
      const response = await axiosClient.get(`/api/applications/${applicationId}/cv-download`, {
        responseType: 'blob',
        headers: { 'X-Skip-Error-Toast': '1' },
      })

      let fileName =
        typeof response.headers['content-disposition'] === 'string'
          ? parseContentDispositionFilename(response.headers['content-disposition'])
          : null
      fileName ||= 'cv.pdf'

      const url = URL.createObjectURL(response.data)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>
      const data = axiosError.response?.data
      if (data instanceof Blob) {
        const text = await data.text()
        let message = 'Could not download CV.'
        try {
          const body = JSON.parse(text) as { message?: string }
          if (body.message) {
            message = body.message
          }
        } catch {
          // ignore non-JSON error body
        }
        throw new Error(message)
      }
      throw error
    }
  },
}

function parseContentDispositionFilename(header: string) {
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim())
  }
  const asciiMatch = /filename="([^"]+)"/i.exec(header)
  if (asciiMatch?.[1]) {
    return asciiMatch[1].trim()
  }
  return null
}
