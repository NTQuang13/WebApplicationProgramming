import { Link } from 'react-router-dom'
import { Home, SearchX } from 'lucide-react'

function NotFoundPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <SearchX className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-slate-500">The page you’re looking for doesn’t exist (yet).</p>
        <Link
          to="/jobs"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-700 hover:shadow-md"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </section>
  )
}

export default NotFoundPage

