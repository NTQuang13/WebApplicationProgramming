import SignupForm from '../components/Auth/SignupForm'

function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-6xl items-center justify-center px-4 py-12">
      <div className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft lg:grid-cols-[1fr_440px]">
        <section className="hidden bg-brand-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-100">Create account</p>
            <h1 className="mt-5 max-w-lg text-4xl font-bold leading-tight">
              Build a focused profile for better job matching.
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-brand-50">
            Candidates can track applications and CVs. Recruiters can prepare job posting and company workflows.
          </p>
        </section>
        <section className="p-6 sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-ink">Create your account</h2>
            <p className="mt-2 text-sm text-slate-500">Choose a candidate or recruiter workspace.</p>
          </div>
          <SignupForm />
        </section>
      </div>
    </div>
  )
}

export default SignupPage
