import LoginForm from '../components/Auth/LoginForm'

function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-6xl items-center justify-center px-4 py-12">
      <div className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft lg:grid-cols-[1fr_420px]">
        <section className="hidden bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-100">JobPortal</p>
            <h1 className="mt-5 max-w-lg text-4xl font-bold leading-tight">
              Find roles faster with a clean hiring workspace.
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-slate-200">
            <div>
              <p className="text-2xl font-bold text-white">2k+</p>
              Active jobs
            </div>
            <div>
              <p className="text-2xl font-bold text-white">500+</p>
              Companies
            </div>
            <div>
              <p className="text-2xl font-bold text-white">24h</p>
              Fast review
            </div>
          </div>
        </section>
        <section className="p-6 sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-ink">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">Continue to your job search dashboard.</p>
          </div>
          <LoginForm />
        </section>
      </div>
    </div>
  )
}

export default LoginPage
