import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import JobForm from '@/components/Job/JobForm'
import { jobService } from '@/services/jobService'
import type { Job } from '@/types/job'

function PostJobPage() {
  const { id } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    const fetchJob = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await jobService.getJobById(id)

        if (isMounted) {
          setJob(response)
        }
      } catch {
        if (isMounted) {
          setError('Failed to load job for editing')
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

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/manage-jobs"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Manage Jobs
      </Link>

      <div className="mb-6 mt-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Recruiter</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">{id ? 'Edit Job Posting' : 'Post a New Job'}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Create a clear, searchable job post with salary, company, and requirements.
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : (
        <JobForm initialJob={job} />
      )}
    </section>
  )
}

export default PostJobPage
