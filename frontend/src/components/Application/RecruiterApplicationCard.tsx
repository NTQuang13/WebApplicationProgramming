import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Briefcase,
  CalendarDays,
  CheckCircle,
  Clock,
  Download,
  Mail,
  User,
  XCircle,
} from 'lucide-react'
import type { Application, ApplicationStatus } from '@/types'
import { applicationService } from '@/services/applicationService'

interface RecruiterApplicationCardProps {
  application: Application
  onStatusUpdated: () => void
}

const statusClasses: Record<ApplicationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  reviewed: 'bg-blue-50 text-blue-700',
  accepted: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
}

const statusIcon: Record<ApplicationStatus, ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  reviewed: <CheckCircle className="h-3.5 w-3.5" />,
  accepted: <CheckCircle className="h-3.5 w-3.5" />,
  rejected: <XCircle className="h-3.5 w-3.5" />,
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const statusOptions: ApplicationStatus[] = ['pending', 'reviewed', 'accepted', 'rejected']

function RecruiterApplicationCard({ application, onStatusUpdated }: RecruiterApplicationCardProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const candidateLabel = application.candidateName ?? 'Candidate'
  const candidateMail = application.candidateEmail ?? '—'

  const handleStatusChange = async (next: ApplicationStatus) => {
    if (next === application.status) return
    try {
      setIsUpdatingStatus(true)
      await applicationService.updateApplicationStatus(application.id, next)
      onStatusUpdated()
    } catch {
      toast.error('Could not update application status.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDownloadCv = async () => {
    try {
      setIsDownloading(true)
      await applicationService.downloadApplicationCv(application.id)
    } catch {
      toast.error('Could not download CV.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <Link
              to={`/jobs/${application.jobId}`}
              className="text-lg font-bold text-ink transition hover:text-brand-600"
            >
              {application.jobTitle ?? 'Untitled role'}
            </Link>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Briefcase className="h-4 w-4 shrink-0 text-brand-600" />
              <span>{application.companyName ?? '—'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2 font-medium text-ink">
              <User className="h-4 w-4 text-brand-600" />
              {candidateLabel}
            </span>
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-600" />
              {candidateMail !== '—' ? (
                <a href={`mailto:${candidateMail}`} className="text-brand-600 underline-offset-4 hover:underline">
                  {candidateMail}
                </a>
              ) : (
                <span className="text-slate-500">—</span>
              )}
            </span>
          </div>

          <p className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4 shrink-0 text-brand-600" />
            Applied {formatDate(application.appliedAt)}
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              disabled={isDownloading}
              onClick={() => void handleDownloadCv()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? 'Downloading…' : 'Download CV'}
            </button>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:min-w-44 lg:items-end">
          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses[application.status]}`}
          >
            {statusIcon[application.status]}
            {application.status}
          </span>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 lg:text-right">
            Update status
            <select
              value={application.status}
              disabled={isUpdatingStatus}
              onChange={(event) =>
                void handleStatusChange(event.target.value as ApplicationStatus)
              }
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:opacity-50 lg:w-48"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </article>
  )
}

export default RecruiterApplicationCard
