import { Search } from 'lucide-react'
import EmptyState from '@/components/Common/EmptyState'
import type { Job } from '@/types/job'
import JobCard from './JobCard'

interface JobListProps {
  jobs: Job[]
  bookmarkedJobIds?: Set<string>
  onBookmarkToggle?: (jobId: string, isBookmarked: boolean) => void
}

function JobList({ jobs, bookmarkedJobIds, onBookmarkToggle }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No jobs found"
        description="Try changing your keyword, location, salary range, or job type filters."
        icon={<Search className="h-6 w-6" />}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          isBookmarked={bookmarkedJobIds?.has(job.id) ?? false}
          onBookmarkToggle={(isBookmarked) => onBookmarkToggle?.(job.id, isBookmarked)}
        />
      ))}
    </div>
  )
}

export default JobList
