import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Loader2 } from 'lucide-react'
import EmptyState from '@/components/Common/EmptyState'
import JobCard from '@/components/Job/JobCard'
import { bookmarkService } from '@/services/bookmarkService'
import { useBookmarkStore } from '@/store/bookmarkStore'
import type { Bookmark } from '@/types'
import type { Job } from '@/types/job'


const LIMIT = 9


const bookmarkToJob = (bookmark: Bookmark): Job => ({
  id: bookmark.jobId,
  title: bookmark.title,
  companyName: bookmark.companyName,
  location: bookmark.location,
  salaryMin: bookmark.salaryMin,
  salaryMax: bookmark.salaryMax,
  jobTypeId: 'saved-job',
  jobTypeName: 'Saved Job',
  experienceLevelId: 'view-details',
  experienceLevelName: 'View details',
  description: `Saved on ${new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(bookmark.savedAt))}. Open the job details to review the full description and requirements.`,
  requirements: [],
  createdAt: bookmark.savedAt,
})

function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setBookmarked } = useBookmarkStore()

  useEffect(() => {
    let isMounted = true

    const fetchBookmarks = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await bookmarkService.getBookmarks(page, LIMIT)

        if (isMounted) {
          setBookmarks(response.data ?? [])
          const hasMore = (response.data?.length ?? 0) >= LIMIT
          setTotalPages(hasMore ? page + 1 : page)
        }
      } catch {
        if (isMounted) {
          setError('Failed to load bookmarks')
          setBookmarks([])
          setTotalPages(1)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchBookmarks()

    return () => {
      isMounted = false
    }
  }, [page])

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Bookmarks</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Saved Jobs</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Keep interesting roles close while you compare opportunities.
          </p>
        </div>
        <Link
          to="/jobs"
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Browse Jobs
        </Link>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : bookmarks.length === 0 ? (
        <EmptyState
          title="No saved jobs. Start bookmarking!"
          description="Tap the heart on any job to save it here."
          icon={<Heart className="h-6 w-6" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <JobCard
              key={bookmark.bookmarkId}
              job={bookmarkToJob(bookmark)}
              isBookmarked
              onBookmarkToggle={(isBookmarked) => {
                if (!isBookmarked) {
                  setBookmarks((current) => current.filter((item) => item.jobId !== bookmark.jobId))
                  setBookmarked(bookmark.jobId, false)
                }
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          disabled={page <= 1 || isLoading}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm font-medium text-slate-600">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages || isLoading}
          onClick={() => setPage((value) => value + 1)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </section>
  )
}

export default BookmarksPage
