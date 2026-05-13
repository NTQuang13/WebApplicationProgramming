import { api } from '@/services/api'
import type { Bookmark } from '@/types'
import type { BackendListResponse } from './applicationService'

export const bookmarkService = {
  saveBookmark: (jobId: string) =>
    api.post<{ message: string; bookmark: { id: string; jobId: string } }, { jobId: string }>('/api/bookmarks', { jobId }),
  removeBookmark: (jobId: string) => api.delete<{ message: string }>(`/api/bookmarks/${jobId}`),
  getBookmarks: (page = 1, limit = 10) =>
    api.get<BackendListResponse<Bookmark>>('/api/bookmarks', {
      params: { page, limit },
    }),
  getAllBookmarks: async () => {
    const first = await bookmarkService.getBookmarks(1, 50)
    const items = [...(first.data ?? [])]
    return items
  },
}
