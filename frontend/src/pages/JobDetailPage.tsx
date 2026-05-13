import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Briefcase, CalendarDays, DollarSign, Loader2, MapPin } from 'lucide-react'
import ApplyModal from '@/components/Application/ApplyModal'
import BookmarkButton from '@/components/Bookmark/BookmarkButton'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { useAuthStore } from '@/store/authStore'
import { jobService } from '@/services/jobService'
import type { Job } from '@/types/job'

const formatSalary = (salaryMin?: number, salaryMax?: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'USD',
  })

  if (salaryMin && salaryMax) {
    return `${formatter.format(salaryMin)} - ${formatter.format(salaryMax)}`
  }

  if (salaryMin) {
    return `From ${formatter.format(salaryMin)}`
  }

  if (salaryMax) {
    return `Up to ${formatter.format(salaryMax)}`
  }

  return 'Salary undisclosed'
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const { bookmarkedJobIds, isLoaded, refresh: refreshBookmarks, setBookmarked } = useBookmarkStore()
  const isRecruiter = user?.role === 'recruiter'
  const isCandidate = user?.role === 'candidate'

  useEffect(() => {
    if (isCandidate && !isLoaded) {
      void refreshBookmarks()
    }
  }, [isCandidate, isLoaded, refreshBookmarks])

  useEffect(() => {
    let isMounted = true

    const fetchJob = async () => {
      if (!id) {
        setError('Job not found')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const response = await jobService.getJobById(id)

        if (isMounted) {
          setJob(response)
        }
      } catch {
        if (isMounted) {
          setError('Failed to load job')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchJob()

    return () => {
      isMounted = false
    }
  }, [id])

  const requirements = useMemo(() => {
    if (!job?.requirements) {
      return []
    }

    return Array.isArray(job.requirements)
      ? job.requirements
      : job.requirements
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)
  }, [job])

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center">
        <Loader2 className="h-9 w-9 animate-spin text-brand-600" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-ink">{error === 'Job not found' ? 'Job not found' : 'Failed to load'}</h1>
        <p className="mt-3 text-sm text-slate-500">The job may have been removed or the server is unavailable.</p>
        <button
          type="button"
          onClick={() => navigate('/jobs')}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </button>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      <article className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        <header className="border-b border-slate-200 px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold leading-tight text-ink">{job.title}</h1>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-brand-600" />
                  {job.companyName}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-600" />
                  {job.location}
                </span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-brand-600" />
                  Posted {formatDate(job.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              {isCandidate && (
                <BookmarkButton
                  jobId={job.id}
                  isBookmarked={bookmarkedJobIds.has(job.id)}
                  onToggle={(nextIsBookmarked) => setBookmarked(job.id, nextIsBookmarked)}
                />
              )}
            </div>
          </div>
        </header>

        <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[1fr_280px]">
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-ink">Description</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{job.description}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink">Requirements</h2>
              {requirements.length > 0 ? (
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  {requirements.map((requirement) => (
                    <li key={requirement} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No requirements listed yet.</p>
              )}
            </section>
          </div>

          <aside className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-bold text-ink">Quick Info</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <DollarSign className="h-4 w-4 text-brand-600" />
                  Salary
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">{formatSalary(job.salaryMin, job.salaryMax)}</p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Job Type</p>
                <span className="mt-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                  {job.jobTypeName || job.jobTypeId}
                </span>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Experience</p>
                <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {job.experienceLevelName || job.experienceLevelId}
                </span>
              </div>
            </div>

            {!isRecruiter && (
              <button
                type="button"
                onClick={() => setIsApplyOpen(true)}
                className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
              >
                Apply Now
              </button>
            )}
          </aside>
        </div>
      </article>
      <ApplyModal
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.companyName}
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
      />
    </section>
  )
}

export default JobDetailPage
