import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Mail, LockKeyhole } from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'

function LoginForm() {
  const navigate = useNavigate()
  const { setUser, setToken, setError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authService.signin({ email, password })
      setUser(response.user)
      setToken(response.token)
      toast.success('Welcome back.')
      navigate('/jobs')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <div className="mt-2 flex items-center rounded-lg border border-slate-200 bg-white px-3 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
          <Mail className="h-4 w-4 text-slate-400" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full border-0 bg-transparent px-3 py-3 text-sm text-ink outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="mt-2 flex items-center rounded-lg border border-slate-200 bg-white px-3 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
          <LockKeyhole className="h-4 w-4 text-slate-400" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            className="w-full border-0 bg-transparent px-3 py-3 text-sm text-ink outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? <LoadingSpinner size="sm" /> : 'Sign in'}
      </button>

      <p className="text-center text-sm text-slate-500">
        New to JobPortal?{' '}
        <Link to="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </form>
  )
}

export default LoginForm
