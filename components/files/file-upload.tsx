'use client'

import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText, Loader2 } from 'lucide-react'

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
}

export function FileUpload({ onUpload, accept, maxSizeMB = 10, disabled }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`ファイルサイズは${maxSizeMB}MB以下にしてください`)
      return false
    }
    setError(null)
    return true
  }

  const handleFile = useCallback(async (file: File) => {
    if (!validateFile(file)) return
    setSelectedFile(file)
    setUploading(true)
    try {
      await onUpload(file)
      setSelectedFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }, [onUpload, maxSizeMB])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        } ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-600">{selectedFile?.name} をアップロード中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">
              タップしてファイルを選択
            </p>
            <p className="text-xs text-gray-400 hidden sm:block">
              またはドラッグ&ドロップ（最大{maxSizeMB}MB）
            </p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

interface FileListItemProps {
  name: string
  size?: number | null
  url?: string
  onDelete?: () => void
}

export function FileListItem({ name, size, url, onDelete }: FileListItemProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <FileText className="h-5 w-5 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">
            {name}
          </a>
        ) : (
          <p className="text-sm text-gray-700 truncate">{name}</p>
        )}
        {size != null && <p className="text-xs text-gray-400">{formatSize(size)}</p>}
      </div>
      {onDelete && (
        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={onDelete}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
