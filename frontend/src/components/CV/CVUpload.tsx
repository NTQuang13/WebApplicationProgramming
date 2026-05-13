import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { toast } from 'sonner'
import { FileText, Loader2, UploadCloud } from 'lucide-react'
import { cvService } from '@/services/cvService'

interface CVUploadProps {
  onUploaded: () => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const allowedExtensions = ['pdf', 'doc', 'docx']

const isValidCV = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension ? allowedExtensions.includes(extension) : false
}

function CVUpload({ onUploaded }: CVUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const uploadFile = async (file?: File) => {
    if (!file) {
      return
    }

    if (!isValidCV(file)) {
      toast.error('Only PDF, DOC, or DOCX files are supported.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('CV file must be 5MB or smaller.')
      return
    }

    try {
      setIsUploading(true)
      await cvService.uploadCV(file)
      toast.success('CV uploaded successfully')
      onUploaded()
    } catch {
      toast.error('Failed to upload CV.')
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void uploadFile(event.target.files?.[0])
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    void uploadFile(event.dataTransfer.files[0])
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink">Upload CV</h2>
          <p className="text-sm text-slate-500">PDF, DOC, or DOCX. Maximum file size 5MB.</p>
        </div>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
          isDragging ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-slate-50 hover:border-brand-300'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
        ) : (
          <UploadCloud className="h-10 w-10 text-brand-600" />
        )}
        <p className="mt-4 text-sm font-semibold text-ink">
          {isUploading ? 'Uploading your CV...' : 'Drop your CV here or click to browse'}
        </p>
        <p className="mt-1 text-xs text-slate-500">Your parsed CV status will appear below.</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleInputChange}
          disabled={isUploading}
          className="hidden"
        />
      </div>
    </section>
  )
}

export default CVUpload
