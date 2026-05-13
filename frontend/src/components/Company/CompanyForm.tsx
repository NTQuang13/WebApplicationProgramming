import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Building2, Loader2, Plus } from 'lucide-react'
import { companyService } from '@/services/companyService'

interface CompanyFormProps {
  onCreated: () => void
}

function CompanyForm({ onCreated }: CompanyFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!name.trim() || !description.trim()) {
      toast.error('Company name and description are required.')
      return
    }

    try {
      setIsSubmitting(true)
      await companyService.createCompany({
        name: name.trim(),
        description: description.trim(),
        website: website.trim() || undefined,
      })
      setName('')
      setDescription('')
      setWebsite('')
      toast.success('Company created successfully')
      onCreated()
    } catch {
      toast.error('Failed to create company.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink">Create Company</h2>
          <p className="text-sm text-slate-500">Add a company profile before posting roles.</p>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <label htmlFor="company-name" className="text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="company-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>
        <div>
          <label htmlFor="company-description" className="text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="company-description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>
        <div>
          <label htmlFor="company-website" className="text-sm font-medium text-slate-700">
            Website
          </label>
          <input
            id="company-website"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            placeholder="https://example.com"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create Company
        </button>
      </div>
    </form>
  )
}

export default CompanyForm
