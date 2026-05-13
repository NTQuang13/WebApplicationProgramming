import { useEffect, useState, type FormEvent } from 'react'
import { Filter, Search, X } from 'lucide-react'
import { masterDataService, type Category, type ExperienceLevel } from '@/services/masterDataService'
import type { JobFilter } from '@/types/job'

interface JobFilterSidebarProps {
  filters: JobFilter
  onApply: (filters: JobFilter) => void
  onClear: () => void
  onClose?: () => void
}

const locations = [
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bạc Liêu', 'Bắc Giang', 'Bắc Kạn', 'Bắc Ninh', 'Bến Tre', 'Bình Dương', 'Bình Định', 'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Cần Thơ', 'Đà Nẵng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Nội', 'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lạng Sơn', 'Lào Cai', 'Lâm Đồng', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'TP. Hồ Chí Minh', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
]

function JobFilterSidebar({ filters, onApply, onClear, onClose }: JobFilterSidebarProps) {
  const [draft, setDraft] = useState<JobFilter>(filters)
  const [categories, setCategories] = useState<Category[]>([])
  const [experienceLevels, setExperienceLevels] = useState<ExperienceLevel[]>([])

  useEffect(() => {
    setDraft(filters)
  }, [filters])

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [cats, levels] = await Promise.all([
          masterDataService.getCategories(),
          masterDataService.getExperienceLevels(),
        ])
        setCategories(cats)
        setExperienceLevels(levels)
      } catch (error) {
        console.error('Failed to load filter data:', error)
      }
    }
    void fetchMasterData()
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const expectedSalary =
      Number.isFinite(draft.expectedSalary) && draft.expectedSalary !== undefined ? draft.expectedSalary : undefined

    onApply({
      ...draft,
      page: 1,
      expectedSalary,
    })
  }

  const handleJobTypeChange = (jobTypeId: string) => {
    setDraft((current) => {
      const currentIds = current.jobTypeId ? current.jobTypeId.split(',') : []
      const newIds = currentIds.includes(jobTypeId)
        ? currentIds.filter((id) => id !== jobTypeId)
        : [...currentIds, jobTypeId]
      return {
        ...current,
        jobTypeId: newIds.length > 0 ? newIds.join(',') : undefined,
      }
    })
  }

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-bold text-ink">Advanced Search</h2>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ink lg:hidden"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="q" className="text-sm font-medium text-slate-700">
            Keyword
          </label>
          <div className="mt-2 flex items-center rounded-lg border border-slate-200 px-3 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              id="q"
              value={draft.q ?? ''}
              onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))}
              placeholder="Title, skills, company"
              className="w-full border-0 bg-transparent px-3 py-2.5 text-sm text-ink outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="text-sm font-medium text-slate-700">
            Location
          </label>
          <select
            id="location"
            value={draft.location ?? ''}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                location: event.target.value || undefined,
              }))
            }
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">Any location</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Job Type</legend>
          <div className="mt-3 space-y-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={draft.jobTypeId ? draft.jobTypeId.split(',').includes(cat.id) : false}
                  onChange={() => handleJobTypeChange(cat.id)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {cat.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="experienceLevelId" className="text-sm font-medium text-slate-700">
            Experience Level
          </label>
          <select
            id="experienceLevelId"
            value={draft.experienceLevelId ?? ''}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                experienceLevelId: event.target.value || undefined,
              }))
            }
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">Any level</option>
            {experienceLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="expectedSalary" className="text-sm font-medium text-slate-700">
            Expected Salary
          </label>
          <input
            id="expectedSalary"
            type="number"
            min="0"
            value={draft.expectedSalary ?? ''}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                expectedSalary: event.target.value ? Number(event.target.value) : undefined,
              }))
            }
            placeholder="e.g. 1500"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Clear All
          </button>
        </div>
      </form>
    </aside>
  )
}

export default JobFilterSidebar
