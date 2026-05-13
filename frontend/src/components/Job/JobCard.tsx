import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, DollarSign, MapPin } from 'lucide-react'
import ApplyModal from '@/components/Application/ApplyModal'
import BookmarkButton from '@/components/Bookmark/BookmarkButton'
import { useAuthStore } from '@/store/authStore'
import type { Job } from '@/types/job'

interface JobCardProps {
  job: Job
  isBookmarked?: boolean
  onBookmarkToggle?: (isBookmarked: boolean) => void
}

const formatSalary = (salaryMin?: number, salaryMax?: number) => {
  if (!salaryMin && !salaryMax) {
    return 'Salary undisclosed'
  }

  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'USD',
  })

  if (salaryMin && salaryMax) {
    return `${formatter.format(salaryMin)} - ${formatter.format(salaryMax)}`
  }

  return salaryMin ? `From ${formatter.format(salaryMin)}` : `Up to ${formatter.format(salaryMax ?? 0)}`
}

function JobCard({ job, isBookmarked = false, onBookmarkToggle }: JobCardProps) {
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const isRecruiter = user?.role === 'recruiter'

  return (
    <>
      <article className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              to={`/jobs/${job.id}`}
              className="text-lg font-bold leading-7 text-ink transition hover:text-brand-600"
            >
              {job.title}
            </Link>
            <p className="mt-1 text-sm font-medium text-slate-600">{job.companyName}</p>
          </div>
          {!isRecruiter && (
            <BookmarkButton jobId={job.id} isBookmarked={isBookmarked} onToggle={onBookmarkToggle} />
          )}
        </div>

        <div className="mt-5 space-y-3 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-600" />
            {job.location}
          </p>
          <p className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-brand-600" />
            {formatSalary(job.salaryMin, job.salaryMax)}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <Briefcase className="h-3.5 w-3.5" />
            {job.jobTypeName || job.jobTypeId}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {job.experienceLevelName || job.experienceLevelId}
          </span>
        </div>

        <p className="mt-5 line-clamp-3 flex-1 text-sm leading-6 text-slate-500">{job.description}</p>

        <div className="mt-6 flex gap-3">
          {!isRecruiter && (
            <button
              type="button"
              onClick={() => setIsApplyOpen(true)}
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Apply
            </button>
          )}
          <Link
            to={`/jobs/${job.id}`}
            className={`${
              isRecruiter ? 'flex-1' : ''
            } rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-center text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700`}
          >
            Details
          </Link>
        </div>
      </article>
      <ApplyModal
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.companyName}
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
      />
    </>
  )
}

export default JobCard
