import { Link } from 'react-router-dom'
import { Building2, ExternalLink, ArrowRight, Plus } from 'lucide-react'
import EmptyState from '@/components/Common/EmptyState'
import { useAuthStore } from '@/store/authStore'
import type { Company } from '@/types'

interface CompanyListProps {
  companies: Company[]
}

function CompanyList({ companies }: CompanyListProps) {
  const user = useAuthStore((state) => state.user)
  const isRecruiter = user?.role === 'recruiter'

  if (companies.length === 0) {
    return (
      <EmptyState
        title="No companies yet"
        description="Create a company profile to start posting jobs."
        icon={<Building2 className="h-6 w-6" />}
      />
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {companies.map((company) => (
        <article key={company.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-ink">{company.name}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{company.description}</p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Building2 className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {company.website ? (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Website
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <span className="text-sm text-slate-400">No website provided</span>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              {isRecruiter ? (
                <Link
                  to="/jobs/new"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  <Plus className="h-4 w-4" />
                  Post Job
                </Link>
              ) : (
                <Link
                  to={`/companies/${company.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  View jobs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default CompanyList
