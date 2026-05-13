import { Briefcase } from 'lucide-react'
import type { EmptyStateProps } from '../../types'

function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-lg border border-slate-200 bg-white px-6 py-10 text-center shadow-soft">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        {icon ?? <Briefcase className="h-6 w-6" />}
      </div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
  )
}

export default EmptyState
