import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, ExternalLink, Filter, Loader2, Search, UserRound, X } from 'lucide-react'
import EmptyState from '@/components/Common/EmptyState'
import { searchService, type CVSearchHit } from '@/services/searchService'
import { cvService } from '@/services/cvService'

const stripHighlightHtml = (fragment: string) => fragment.replace(/<[^>]*>/g, '').trim()
const PAGE_SIZE = 10

function CVSearchPage() {
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [activeQuery, setActiveQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<CVSearchHit[]>([])
  const [total, setTotal] = useState(0)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [selected, setSelected] = useState<CVSearchHit | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const runSearch = useCallback(
    async (q: string, pageNum: number, pageSize: number) => {
      setIsSearching(true)
      setSelected(null)
      try {
        const res = await searchService.searchCVs({ q, page: pageNum, limit: pageSize })
        setResults(res.data)
        setTotal(res.total)
        setLatencyMs(res.latencyMs)
        setActiveQuery(q)
        setHasSearched(true)
        setPage(res.page)
      } catch (error: unknown) {
        console.error('CV search error:', error)
        const err = error as { response?: { status?: number; data?: { message?: string } } }
        const status = err.response?.status
        const message = err.response?.data?.message
        if (status === 400 && message) {
          toast.error(message)
        } else {
          toast.error('Unable to search CVs right now.')
        }
        setResults([])
        setTotal(0)
        setLatencyMs(null)
      } finally {
        setIsSearching(false)
      }
    },
    [],
  )

  useEffect(() => {
    void runSearch('', 1, PAGE_SIZE)
  }, [runSearch])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await runSearch(keyword.trim(), 1, PAGE_SIZE)
  }

  const goToPage = async (next: number) => {
    if (next < 1 || next > totalPages || !hasSearched) return
    await runSearch(activeQuery, next, PAGE_SIZE)
  }

  const handleClear = () => {
    setKeyword('')
    setSelected(null)
    void runSearch('', 1, PAGE_SIZE)
  }

  const handleDownload = async (hit: CVSearchHit) => {
    setDownloadingId(hit.cvId)
    try {
      await cvService.downloadCandidateCvAsRecruiter(hit.cvId)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not download this CV.'
      toast.error(message)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Recruiter</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">CV Search</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Full-text search over indexed CV content (Elasticsearch). Download is available when the candidate has
            applied to at least one job you created (same rule as application CV download).
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Filter className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-ink">Search</h2>
              <p className="text-sm text-slate-500">Leave keyword empty to list submitted CVs.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label htmlFor="cv-keyword" className="text-sm font-medium text-slate-700">
                Keyword
              </label>
              <input
                id="cv-keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. React, data engineer, HCMC…"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="submit"
              disabled={isSearching}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search CVs
            </button>
            <button
              type="button"
              disabled={isSearching}
              onClick={handleClear}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>
        </form>

        <div className="min-w-0">
          {hasSearched ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
              <p>
                <span className="font-medium text-ink">{total}</span> result{total === 1 ? '' : 's'}
                {latencyMs != null ? (
                  <span className="text-slate-500">
                    {' '}
                    · {latencyMs} ms
                  </span>
                ) : null}
              </p>
              {total > 0 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || isSearching}
                    onClick={() => void goToPage(page - 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>
                  <span className="text-xs text-slate-500">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages || isSearching}
                    onClick={() => void goToPage(page + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {isSearching ? (
            <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
              <EmptyState
                title={activeQuery ? 'No CVs match your query' : 'No submitted CVs yet'}
                description={
                  activeQuery
                    ? 'Try a broader keyword, or leave the keyword empty to show submitted CVs.'
                    : 'Candidates have not applied to your jobs yet, so there are no CVs to display.'
                }
                icon={<UserRound className="h-6 w-6" />}
              />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((hit) => {
                const preview =
                  hit.highlights?.length > 0
                    ? hit.highlights.map((h) => stripHighlightHtml(h)).join(' … ')
                    : null
                const scoreLabel =
                  hit.score != null && Number.isFinite(hit.score) ? hit.score.toFixed(2) : null

                return (
                  <article
                    key={hit.cvId}
                    className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-ink">{hit.fileName || 'CV'}</h2>
                        <p className="mt-1 text-xs text-slate-500">
                          CV ID: {hit.cvId.slice(0, 8)}… · User: {hit.userId.slice(0, 8)}…
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {hit.createdAt ? new Date(hit.createdAt).toLocaleString() : '—'}
                        </p>
                      </div>
                      {scoreLabel ? (
                        <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                          score {scoreLabel}
                        </span>
                      ) : null}
                    </div>

                    {preview ? (
                      <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">{preview}</p>
                    ) : (
                      <p className="mt-4 text-sm italic text-slate-400">No text highlights for this hit.</p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setSelected(hit)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-700 hover:shadow-md"
                      >
                        Details
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={downloadingId === hit.cvId}
                        onClick={() => void handleDownload(hit)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all duration-200 hover:bg-slate-50"
                      >
                        {downloadingId === hit.cvId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Download
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-xl bg-white shadow-soft">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div className="min-w-0 pr-4">
                <h2 className="break-words text-xl font-bold text-ink">{selected.fileName}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}
                  {selected.score != null && Number.isFinite(selected.score)
                    ? ` · score ${selected.score.toFixed(4)}`
                    : ''}
                </p>
                <p className="mt-1 break-all font-mono text-xs text-slate-500">cvId: {selected.cvId}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ink"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div>
                <p className="text-sm font-semibold text-ink">Highlighted snippets</p>
                {selected.highlights?.length ? (
                  <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                    {selected.highlights.map((h, i) => (
                      <li key={i} className="break-words">
                        {stripHighlightHtml(h)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No highlights returned for this document.</p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={downloadingId === selected.cvId}
                  onClick={() => void handleDownload(selected)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-700 hover:shadow-md disabled:opacity-60"
                >
                  {downloadingId === selected.cvId ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  Download CV
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default CVSearchPage

