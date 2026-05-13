import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import JobList from '@/components/Job/JobList'
import { companyService } from '@/services/companyService'
import { jobService } from '@/services/jobService'
import type { Company } from '@/types'
import type { Job, JobFilter, PaginatedJobsResponse } from '@/types/job'

const DEFAULT_LIMIT = 9

const toNumber = (value: string | null, fallback?: number) => {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
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

function CompanyJobsPage() {
  const { id } = useParams()
  const companyId = id ?? ''
  const [searchParams, setSearchParams] = useSearchParams()
  const [company, setCompany] = useState<Company | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filters = useMemo<JobFilter>(
    () => ({
      companyId,
      page: toNumber(searchParams.get('page'), 1),
      limit: toNumber(searchParams.get('limit'), DEFAULT_LIMIT),
    }),
    [companyId, searchParams],
  )

  useEffect(() => {
    let isMounted = true

    const fetchAll = async () => {
      if (!companyId) return
      try {
        setIsLoading(true)
        setError(null)

        const [companyResponse, jobsResponseRaw] = await Promise.all([
          companyService.getCompanyById(companyId),
          jobService.getJobs(filters),
        ])

        const jobsResponse = normalizeJobsResponse(jobsResponseRaw)

        if (!isMounted) return

        setCompany(companyResponse)
        setJobs(jobsResponse.data)
        setTotal(jobsResponse.pagination.total)
        setTotalPages(jobsResponse.pagination.totalPages)
      } catch {
        if (isMounted) {
          setError('Failed to load company jobs')
          setCompany(null)
          setJobs([])
          setTotal(0)
          setTotalPages(1)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void fetchAll()

    return () => {
      isMounted = false
    }
  }, [companyId, filters])

  const currentPage = filters.page ?? 1
  const limit = filters.limit ?? DEFAULT_LIMIT
  const startResult = total === 0 ? 0 : (currentPage - 1) * limit + 1
  const endResult = Math.min(currentPage * limit, total)

  const changePage = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    params.set('limit', String(limit))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/companies" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Back to companies
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-ink">{company?.name ?? 'Company'}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Showing {startResult}-{endResult} of {total} jobs
          </p>
        </div>
      </div>

      {company?.description ? (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm leading-6 text-slate-600 shadow-sm">
          {company.description}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</div>
      ) : (
        <JobList jobs={jobs} />
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
    </section>
  )
}

export default CompanyJobsPage

