import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Briefcase, CalendarDays, CheckCircle, Clock, Download, XCircle } from 'lucide-react'
import type { Application, ApplicationStatus } from '@/types'
import { cvService } from '@/services/cvService'

interface ApplicationCardProps {
  application: Application
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

function ApplicationCard({ application }: ApplicationCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadCv = async () => {
    try {
      setIsDownloading(true)
      await cvService.downloadCV(application.cvId)
    } catch {
      toast.error('Could not download CV.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to={`/jobs/${application.jobId}`}
            className="text-lg font-bold text-ink transition hover:text-brand-600"
          >
            {application.jobTitle}
          </Link>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <Briefcase className="h-4 w-4 text-brand-600" />
            {application.companyName}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4 text-brand-600" />
            Applied {formatDate(application.appliedAt)}
          </p>
          <button
            type="button"
            disabled={isDownloading}
            onClick={() => void handleDownloadCv()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'Download submitted CV'}
          </button>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses[application.status]}`}
        >
          {statusIcon[application.status]}
          {application.status}
        </span>
      </div>
    </article>
  )
}

export default ApplicationCard
