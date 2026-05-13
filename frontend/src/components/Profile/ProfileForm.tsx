import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Loader2, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { userService } from '@/services/userService'
import type { User as UserType } from '@/types'

interface ProfileFormProps {
  user: UserType
  onUpdated: (user: UserType) => void
}

function ProfileForm({ user, onUpdated }: ProfileFormProps) {
  const setUser = useAuthStore((state) => state.setUser)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? '')

  useEffect(() => {
    setName(user.name)
    setPhone(user.phone ?? '')
  }, [user])

  const handleCancel = () => {
    setName(user.name)
    setPhone(user.phone ?? '')
    setIsEditing(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!name.trim()) {
      toast.error('Name is required.')
      return
    }

    try {
      setIsSaving(true)
      const updatedUser = await userService.updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
      })
      setUser(updatedUser)
      onUpdated(updatedUser)
      setIsEditing(false)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <User className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">Profile Info</h2>
            <p className="text-sm text-slate-500">Manage your visible account details.</p>
          </div>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Edit
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="profile-email"
            value={user.email}
            disabled
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500"
          />
        </div>
        <div>
          <label htmlFor="profile-role" className="text-sm font-medium text-slate-700">
            Role
          </label>
          <input
            id="profile-role"
            value={user.role}
            disabled
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm capitalize text-slate-500"
          />
        </div>
        <div>
          <label htmlFor="profile-name" className="text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="profile-name"
            value={name}
            disabled={!isEditing}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>
        <div>
          <label htmlFor="profile-phone" className="text-sm font-medium text-slate-700">
            Phone
          </label>
          <input
            id="profile-phone"
            value={phone}
            disabled={!isEditing}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Optional phone number"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>
      </div>

      {isEditing ? (
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </button>
        </div>
      ) : null}
    </form>
  )
}

export default ProfileForm
