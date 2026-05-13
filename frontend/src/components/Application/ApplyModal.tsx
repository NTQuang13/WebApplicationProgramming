import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { CheckCircle, FileText, Loader2, X } from 'lucide-react'
import { applicationService } from '@/services/applicationService'
import { cvService } from '@/services/cvService'
import type { CV } from '@/types'

interface ApplyModalProps {
  jobId: string
  jobTitle: string
  companyName: string
  isOpen: boolean
  onClose: () => void
}

const normalizeCVs = (response: { data?: CV[] } | CV[]) => (Array.isArray(response) ? response : (response.data ?? []))

function ApplyModal({ jobId, jobTitle, companyName, isOpen, onClose }: ApplyModalProps) {
  const navigate = useNavigate()
  const [cvs, setCvs] = useState<CV[]>([])
  const [selectedCvId, setSelectedCvId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let isMounted = true

    const fetchCVs = async () => {
      try {
        setIsLoading(true)
        const response = await cvService.getCVs(1, 50)
        const nextCVs = normalizeCVs(response)

        if (isMounted) {
          setCvs(nextCVs)
          setSelectedCvId(nextCVs[0]?.id ?? '')
        }
      } catch {
        if (isMounted) {
          toast.error('Failed to load your CVs.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchCVs()

    return () => {
      isMounted = false
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedCvId) {
      toast.error('Please choose a CV before applying.')
      return
    }

    try {
      setIsSubmitting(true)
      await applicationService.applyJob(jobId, selectedCvId)
      toast.success('Application submitted successfully')
      onClose()
      navigate('/applications')
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 400) {
        const message =
          typeof error.response.data === 'object' &&
          error.response.data !== null &&
          'message' in error.response.data
            ? String(error.response.data.message)
            : 'You have already applied to this job.'
        toast.error(message)
      } else {
        toast.error('Failed to submit application.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-soft">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-ink">Apply for this job</h2>
            <p className="mt-1 text-sm text-slate-500">
              {jobTitle} at {companyName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ink"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
            </div>
          ) : cvs.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">No CVs available.</p>
              <p className="mt-1">Upload a CV before applying to this role.</p>
              <Link to="/cvs" onClick={onClose} className="mt-3 inline-flex font-bold text-amber-900 underline">
                Go to My CVs
              </Link>
            </div>
          ) : (
            <>
              <label htmlFor="cvId" className="text-sm font-medium text-slate-700">
                Choose CV
              </label>
              <div className="mt-2 flex items-center rounded-lg border border-slate-200 px-3 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
                <FileText className="h-4 w-4 text-slate-400" />
                <select
                  id="cvId"
                  value={selectedCvId}
                  onChange={(event) => setSelectedCvId(event.target.value)}
                  className="w-full border-0 bg-transparent px-3 py-3 text-sm text-ink outline-none"
                >
                  {cvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.fileName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isSubmitting || cvs.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApplyModal
