import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Briefcase, Edit, Loader2, Plus, Trash2 } from 'lucide-react'
import EmptyState from '@/components/Common/EmptyState'
import { jobService } from '@/services/jobService'
import { useAuthStore } from '@/store/authStore'
import type { Job } from '@/types/job'

const LIMIT = 50


function ManageJobsPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await jobService.getJobs({
        page: 1,
        limit: LIMIT,
        createdBy: currentUser?.id,
      })
      setJobs(response.data)
    } catch {
      setError('Failed to load job postings')
      setJobs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchJobs()
  }, [currentUser?.id])

  const handleDelete = async (job: Job) => {
    if (!window.confirm(`Delete "${job.title}"?`)) {
      return
    }

    try {
      await jobService.deleteJob(job.id)
      setJobs((current) => current.filter((item) => item.id !== job.id))
      toast.success('Job deleted successfully')
    } catch {
      toast.error('Failed to delete job.')
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Recruiter</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Manage Jobs</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review, edit, and remove job postings created by your recruiter account.
          </p>
        </div>
        <Link
          to="/jobs/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Post New Job
        </Link>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <EmptyState
            title="No job postings yet."
            description="Create your first job posting and start receiving candidate applications."
            icon={<Briefcase className="h-6 w-6" />}
          />
          <div className="mt-6 text-center">
            <Link
              to="/jobs/new"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Post New Job
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_160px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 md:grid">
            <span>Job Title</span>
            <span>Company Name</span>
            <span>Location</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-slate-200">
            {jobs.map((job) => (
              <article key={job.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1.5fr_1fr_1fr_160px] md:items-center">
                <div>
                  <button
                    type="button"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="text-left text-sm font-bold text-ink transition hover:text-brand-600"
                  >
                    {job.title}
                  </button>
                  <p className="mt-1 text-xs text-slate-500 md:hidden">{job.companyName}</p>
                </div>
                <p className="text-sm text-slate-600">{job.companyName}</p>
                <p className="text-sm text-slate-600">{job.location}</p>
                <div className="flex gap-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() => navigate(`/jobs/${job.id}/edit`)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(job)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default ManageJobsPage
