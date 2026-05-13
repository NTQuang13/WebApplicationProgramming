import axiosClient, { api } from '@/services/api'
import type { AxiosError } from 'axios'
import type { CV } from '@/types'
import type { BackendListResponse } from './applicationService'

export const cvService = {
  uploadCV: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return api.post<{ cvId: string; status: string; message: string }, FormData>('/api/cvs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  getCVs: (page = 1, limit = 10) =>
    api.get<BackendListResponse<CV>>('/api/cvs', {
      params: { page, limit },
    }),
  downloadCV: (cvId: string) => downloadCvBlob(`/api/cvs/${cvId}/download`),
  /** Recruiter: CV phải thuộc đơn ứng tuyển vào job do bạn tạo (backend kiểm tra). */
  downloadCandidateCvAsRecruiter: (cvId: string) =>
    downloadCvBlob(`/api/cvs/${cvId}/recruiter-download`),
}

async function downloadCvBlob(url: string) {
  try {
    const response = await axiosClient.get(url, {
      responseType: 'blob',
      headers: { 'X-Skip-Error-Toast': '1' },
    })

    let fileName =
      typeof response.headers['content-disposition'] === 'string'
        ? parseContentDispositionFilename(response.headers['content-disposition'])
        : null
    fileName ||= 'cv.pdf'

    const objectUrl = URL.createObjectURL(response.data)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(objectUrl)
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
