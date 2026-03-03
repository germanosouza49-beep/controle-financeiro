import { DropZone } from '@/components/ui/DropZone'

interface FileUploadProps {
  type: 'csv' | 'pdf'
  onFile: (file: File) => void
}

export function FileUpload({ type, onFile }: FileUploadProps) {
  const accept = type === 'csv' ? '.csv,.xlsx,.xls' : '.pdf'
  const label = type === 'csv' ? 'Arraste seu arquivo CSV ou planilha' : 'Arraste o PDF da fatura'
  const desc = type === 'csv'
    ? 'Formatos aceitos: CSV, XLSX, XLS (max 10MB)'
    : 'PDF da fatura do cartao (max 10MB)'

  return (
    <DropZone
      accept={accept}
      onFiles={(files) => onFile(files[0])}
      label={label}
      description={desc}
    />
  )
}
