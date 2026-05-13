import { create } from 'zustand'
import { bookmarkService } from '@/services/bookmarkService'

interface BookmarkStoreState {
  bookmarkedJobIds: Set<string>
  isLoading: boolean
  isLoaded: boolean
  error: string | null
  refresh: () => Promise<void>
  setBookmarked: (jobId: string, isBookmarked: boolean) => void
  reset: () => void
}

export const useBookmarkStore = create<BookmarkStoreState>((set) => ({
  bookmarkedJobIds: new Set<string>(),
  isLoading: false,
  isLoaded: false,
  error: null,
  refresh: async () => {
    try {
      set({ isLoading: true, error: null })
      const bookmarks = await bookmarkService.getAllBookmarks()
      set({
        bookmarkedJobIds: new Set(bookmarks.map((bookmark) => bookmark.jobId)),
        isLoaded: true,
      })
    } catch {
      set({ error: 'Failed to load bookmarks', isLoaded: true })
    } finally {
      set({ isLoading: false })
    }
  },
  setBookmarked: (jobId, isBookmarked) =>
    set((state) => {
      const next = new Set(state.bookmarkedJobIds)
      if (isBookmarked) {
        next.add(jobId)
      } else {
        next.delete(jobId)
      }
      return { bookmarkedJobIds: next }
    }),
  reset: () => set({ bookmarkedJobIds: new Set<string>(), isLoaded: false, error: null, isLoading: false }),
}))

