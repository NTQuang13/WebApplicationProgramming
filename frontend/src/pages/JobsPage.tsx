import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Filter, Loader2 } from 'lucide-react'
import JobFilterSidebar from '@/components/Job/JobFilterSidebar'
import JobList from '@/components/Job/JobList'
import { jobService } from '@/services/jobService'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { useAuthStore } from '@/store/authStore'
import type { Job, JobFilter, PaginatedJobsResponse } from '@/types/job'

const DEFAULT_LIMIT = 9

const toNumber = (value: string | null, fallback?: number) => {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

const toSearchParams = (filters: JobFilter) => {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })

  return params
}

const normalizeJobsResponse = (response: PaginatedJobsResponse): PaginatedJobsResponse => ({
  data: response.data ?? [],
  pagination: {
    page: response.pagination?.page ?? 1,
    limit: response.pagination?.limit ?? DEFAULT_LIMIT,
    total: response.pagination?.total ?? response.data?.length ?? 0,
    totalPages: response.pagination?.totalPages ?? 1,
  },
})

function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const { bookmarkedJobIds, refresh: refreshBookmarks, setBookmarked } = useBookmarkStore()
  const user = useAuthStore((state) => state.user)

  const filters = useMemo<JobFilter>(
    () => ({
      q: searchParams.get('q') || undefined,
      location: searchParams.get('location') || undefined,
      jobTypeId: searchParams.get('jobTypeId') || undefined,
      experienceLevelId: searchParams.get('experienceLevelId') || undefined,
      expectedSalary: toNumber(searchParams.get('expectedSalary')),
      page: toNumber(searchParams.get('page'), 1),
      limit: toNumber(searchParams.get('limit'), DEFAULT_LIMIT),
    }),
    [searchParams],
  )

  useEffect(() => {
    let isMounted = true

    const fetchJobs = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = normalizeJobsResponse(await jobService.getJobs(filters))

        if (!isMounted) {
          return
        }

        setJobs(response.data)
        setTotal(response.pagination.total)
        setTotalPages(response.pagination.totalPages)
      } catch {
        if (isMounted) {
          setError('Failed to load jobs')
          setJobs([])
          setTotal(0)
          setTotalPages(1)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchJobs()

    return () => {
      isMounted = false
    }
  }, [filters])

  useEffect(() => {
    if (user?.role === 'candidate') {
      void refreshBookmarks()
    }
  }, [refreshBookmarks, user?.role])

  const sortedJobs = useMemo(() => {
    if (!bookmarkedJobIds || bookmarkedJobIds.size === 0) {
      return jobs
    }

    return [...jobs].sort((a, b) => {
      const aSaved = bookmarkedJobIds.has(a.id) ? 1 : 0
      const bSaved = bookmarkedJobIds.has(b.id) ? 1 : 0
      return bSaved - aSaved
    })
  }, [jobs, bookmarkedJobIds])

  const currentPage = filters.page ?? 1
  const limit = filters.limit ?? DEFAULT_LIMIT
  const startResult = total === 0 ? 0 : (currentPage - 1) * limit + 1
  const endResult = Math.min(currentPage * limit, total)

  const applyFilters = (nextFilters: JobFilter) => {
    setSearchParams(toSearchParams({ ...nextFilters, limit }))
    setIsFilterOpen(false)
  }

  const clearFilters = () => {
    setSearchParams(toSearchParams({ page: 1, limit }))
    setIsFilterOpen(false)
  }

  const changePage = (page: number) => {
    setSearchParams(toSearchParams({ ...filters, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Job Search</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Find your next opportunity</h1>
          <p className="mt-2 text-sm text-slate-500">
            Showing {startResult}-{endResult} of {total} results
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 lg:hidden"
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="hidden lg:block">
          <JobFilterSidebar filters={filters} onApply={applyFilters} onClear={clearFilters} />
        </div>

        <div className="min-w-0">
          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-200 bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : (
            <JobList
              jobs={sortedJobs}
              bookmarkedJobIds={bookmarkedJobIds}
              onBookmarkToggle={(jobId, isBookmarked) => {
                setBookmarked(jobId, isBookmarked)
              }}
            />
          )}

          <div className="mt-8 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => changePage(currentPage - 1)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => changePage(currentPage + 1)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {isFilterOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/40 p-4 lg:hidden">
          <div className="ml-auto h-full max-w-sm overflow-y-auto">
            <JobFilterSidebar
              filters={filters}
              onApply={applyFilters}
              onClear={clearFilters}
              onClose={() => setIsFilterOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default JobsPage
