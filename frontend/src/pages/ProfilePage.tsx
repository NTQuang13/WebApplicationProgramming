import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Building2, FileText, Loader2, Users } from 'lucide-react'
import AccountSettings from '@/components/Profile/AccountSettings'
import ProfileForm from '@/components/Profile/ProfileForm'
import { useAuthStore } from '@/store/authStore'
import { userService } from '@/services/userService'
import type { User as UserType } from '@/types'

function ProfilePage() {
  const storedUser = useAuthStore((state) => state.user)
  const setStoredUser = useAuthStore((state) => state.setUser)
  const [user, setUser] = useState<UserType | null>(storedUser)
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchUser = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await userService.getMe()

        if (isMounted) {
          setUser(response)
          setStoredUser(response)
        }
      } catch {
        if (isMounted) {
          setError('Failed to load profile')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchUser()

    return () => {
      isMounted = false
    }
  }, [setStoredUser])

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-ink">Failed to load profile</h1>
        <p className="mt-3 text-sm text-slate-500">Please try again after signing in.</p>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Profile</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Account Center</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Manage your profile, security settings, CVs, and application activity.
        </p>
      </div>

      <div className="mb-6 flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'profile' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
          }`}
        >
          Profile Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'settings' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
          }`}
        >
          Account Settings
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'profile' ? (
          <ProfileForm
            user={user}
            onUpdated={(updatedUser) => {
              setUser(updatedUser)
            }}
          />
        ) : (
          <AccountSettings />
        )}

        {user.role === 'candidate' && (
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              to="/cvs"
              className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold text-ink">My CVs</h2>
                <p className="mt-1 text-sm text-slate-500">Upload and review CV processing status.</p>
              </div>
            </Link>
            <Link
              to="/applications"
              className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Briefcase className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold text-ink">Applications</h2>
                <p className="mt-1 text-sm text-slate-500">Track jobs you have applied for.</p>
              </div>
            </Link>
          </div>
        )}
        {user.role === 'recruiter' && (
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              to="/companies"
              className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold text-ink">Companies</h2>
                <p className="mt-1 text-sm text-slate-500">Browse companies or open company job boards.</p>
              </div>
            </Link>
            <Link
              to="/recruiter/applications"
              className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold text-ink">Applicants</h2>
                <p className="mt-1 text-sm text-slate-500">See candidates who applied to jobs you posted.</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default ProfilePage
