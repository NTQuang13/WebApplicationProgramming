import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Heart, Loader2 } from 'lucide-react'
import { bookmarkService } from '@/services/bookmarkService'

interface BookmarkButtonProps {
  jobId: string
  isBookmarked: boolean
  onToggle?: (isBookmarked: boolean) => void
}

function BookmarkButton({ jobId, isBookmarked, onToggle }: BookmarkButtonProps) {
  const [currentState, setCurrentState] = useState(isBookmarked)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setCurrentState(isBookmarked)
  }, [isBookmarked])

  const handleToggle = async () => {
    try {
      setIsLoading(true)

      if (currentState) {
        await bookmarkService.removeBookmark(jobId)
        setCurrentState(false)
        onToggle?.(false)
        toast.success('Removed from bookmarks')
      } else {
        await bookmarkService.saveBookmark(jobId)
        setCurrentState(true)
        onToggle?.(true)
        toast.success('Job saved to bookmarks')
      }
    } catch {
      toast.error('Failed to update bookmark')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={currentState ? 'Remove bookmark' : 'Bookmark job'}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Heart className={`h-5 w-5 ${currentState ? 'fill-red-500 text-red-500' : ''}`} />
      )}
    </button>
  )
}

export default BookmarkButton
