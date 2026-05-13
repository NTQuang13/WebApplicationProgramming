import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { CheckCircle, Clock, Download, FileText, XCircle } from 'lucide-react'
import EmptyState from '@/components/Common/EmptyState'
import type { CV, CVStatus } from '@/types'
import { cvService } from '@/services/cvService'

interface CVListProps {
  cvs: CV[]
}

const statusClasses: Record<CVStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  processing: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  error: 'bg-red-50 text-red-700',
}

const statusIcon: Record<CVStatus, ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  processing: <Clock className="h-3.5 w-3.5" />,
  completed: <CheckCircle className="h-3.5 w-3.5" />,
  error: <XCircle className="h-3.5 w-3.5" />,
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const formatFileSize = (bytes: number) => {
  if (!bytes) {
    return 'Unknown size'
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function CVList({ cvs }: CVListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (cvId: string) => {
    try {
      setDownloadingId(cvId)
      await cvService.downloadCV(cvId)
    } catch {
      toast.error('Could not download CV.')
    } finally {
      setDownloadingId(null)
    }
  }

  if (cvs.length === 0) {
    return (
      <EmptyState
        title="No CVs uploaded yet"
        description="Upload your first CV to start applying for matching jobs."
        icon={<FileText className="h-6 w-6" />}
      />
    )
  }

  return (
    <div className="space-y-3">
      {cvs.map((cv) => (
        <article
          key={cv.id}
          className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-soft sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-ink">{cv.fileName}</h3>
              <p className="mt-1 text-sm text-slate-500">
                Uploaded {formatDate(cv.createdAt)} • {formatFileSize(cv.fileSize)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={downloadingId === cv.id}
              onClick={() => void handleDownload(cv.id)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {downloadingId === cv.id ? 'Downloading...' : 'Download'}
            </button>
            <span
              className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses[cv.status]}`}
            >
              {statusIcon[cv.status]}
              {cv.status}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}

export default CVList
