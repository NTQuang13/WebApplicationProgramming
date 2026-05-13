import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import CVList from '@/components/CV/CVList'
import CVUpload from '@/components/CV/CVUpload'
import { cvService } from '@/services/cvService'
import type { CV } from '@/types'


const LIMIT = 10


function CVsPage() {
  const [cvs, setCvs] = useState<CV[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    const fetchCVs = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await cvService.getCVs(page, LIMIT)

        if (isMounted) {
          setCvs(response.data ?? [])
          const hasMore = (response.data?.length ?? 0) >= LIMIT
          setTotalPages(hasMore ? page + 1 : page)
        }
      } catch {
        if (isMounted) {
          setError('Failed to load CVs')
          setCvs([])
          setTotalPages(1)
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
  }, [page, refreshKey])

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">My CVs</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">CV Library</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Upload and track CV processing status before submitting job applications.
        </p>
      </div>

      <div className="space-y-6">
        <CVUpload
          onUploaded={() => {
            setPage(1)
            setRefreshKey((key) => key + 1)
          }}
        />

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Uploaded CVs</h2>
            <span className="text-sm text-slate-500">Page {page}</span>
          </div>

          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : (
            <CVList cvs={cvs} />
          )}
        </section>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
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
      </div>
    </section>
  )
}

export default CVsPage
