import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import CompanyForm from '@/components/Company/CompanyForm'
import CompanyList from '@/components/Company/CompanyList'
import { companyService } from '@/services/companyService'
import { useAuthStore } from '@/store/authStore'
import type { Company } from '@/types'
import type { PaginatedResponse } from '@/types/job'

const LIMIT = 20

const normalizeCompanies = (response: PaginatedResponse<Company> | Company[]) =>
  Array.isArray(response) ? response : (response.data ?? [])

function CompanyPage() {
  const { user } = useAuthStore()
  const isRecruiter = user?.role === 'recruiter'
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    const fetchCompanies = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = normalizeCompanies(
          await (isRecruiter
            ? companyService.getMyCompanies(1, LIMIT)
            : companyService.getCompanies(1, LIMIT)),
        )

        if (isMounted) {
          setCompanies(response)
        }
      } catch {
        if (isMounted) {
          setError('Failed to load companies')
          setCompanies([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchCompanies()

    return () => {
      isMounted = false
    }
  }, [isRecruiter, refreshKey])

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Companies</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">
          {isRecruiter ? 'Company Management' : 'Explore Companies'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {isRecruiter
            ? 'Only the companies you created are shown here, and you can only post jobs for those companies.'
            : 'Browse companies and learn more about their openings.'}
        </p>
      </div>

      <div className={`grid gap-6 ${isRecruiter ? 'lg:grid-cols-[360px_1fr]' : ''}`}>
        {isRecruiter ? <CompanyForm onCreated={() => setRefreshKey((key) => key + 1)} /> : null}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Companies</h2>
            <span className="text-sm text-slate-500">{companies.length} total</span>
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
            <CompanyList companies={companies} />
          )}
        </div>
      </div>
    </section>
  )
}

export default CompanyPage
