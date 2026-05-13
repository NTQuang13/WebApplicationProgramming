import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Loader2 } from 'lucide-react'
import RecruiterApplicationCard from '@/components/Application/RecruiterApplicationCard'
import EmptyState from '@/components/Common/EmptyState'
import { applicationService } from '@/services/applicationService'
import type { Application } from '@/types'

const LIMIT = 10

function RecruiterApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await applicationService.getApplications(page, LIMIT)

      setApplications(response.data ?? [])

      const total = response.total
      if (typeof total === 'number' && total >= 0) {
        setTotalPages(Math.max(1, Math.ceil(total / LIMIT)))
      } else {
        const hasMore = (response.data?.length ?? 0) >= LIMIT
        setTotalPages(hasMore ? page + 1 : page)
      }
    } catch {
      setError('Failed to load applicant list')
      setApplications([])
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    void fetchApplications()
  }, [fetchApplications])

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Recruiting</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Applicants</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review candidates who applied to jobs you posted, download their CV, and update application status.
          </p>
        </div>
        <Link
          to="/manage-jobs"
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Manage jobs
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
      ) : applications.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <EmptyState
            title="No applicants yet"
            description="When candidates apply to your job posts, they will appear here with their CV."
            icon={<Briefcase className="h-6 w-6" />}
          />
          <div className="mt-6 text-center">
            <Link
              to="/manage-jobs"
              className="inline-flex rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Back to Manage Jobs
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <RecruiterApplicationCard
              key={application.id}
              application={application}
              onStatusUpdated={fetchApplications}
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

export default RecruiterApplicationsPage
