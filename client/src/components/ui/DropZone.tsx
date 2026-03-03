import { useState, useCallback, useRef } from 'react'
import { Upload, FileText } from 'lucide-react'
import { classNames } from '@/utils/format'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  label?: string
  description?: string
}

export function DropZone({ onFiles, accept, multiple, label, description }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length) onFiles(multiple ? files : [files[0]])
    },
    [onFiles, multiple],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length) onFiles(files)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={classNames(
        'flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200',
        dragging
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
          : 'border-gray-200 dark:border-dark-border hover:border-brand-300 dark:hover:border-brand-700 bg-gray-50 dark:bg-dark-card',
      )}
    >
      <div className="p-3 bg-brand-50 dark:bg-brand-900/30 rounded-full">
        {dragging ? (
          <FileText className="w-8 h-8 text-brand-500" />
        ) : (
          <Upload className="w-8 h-8 text-brand-500" />
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label || 'Arraste e solte aqui'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {description || 'ou clique para selecionar'}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
