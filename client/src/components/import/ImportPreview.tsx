import { AlertTriangle, Check } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/utils/format'

interface PreviewRow {
  date: string
  description: string
  amount: number
  type: string
  isDuplicate?: boolean
}

interface ImportPreviewProps {
  rows: PreviewRow[]
  duplicateCount: number
}

export function ImportPreview({ rows, duplicateCount }: ImportPreviewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Preview ({rows.length} transacoes)
        </h3>
        {duplicateCount > 0 && (
          <Badge variant="warning">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {duplicateCount} duplicatas detectadas
          </Badge>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-100 dark:border-dark-border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-dark-card sticky top-0">
            <tr className="text-xs text-gray-400 uppercase">
              <th className="px-3 py-2 text-left">Data</th>
              <th className="px-3 py-2 text-left">Descricao</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`border-t border-gray-50 dark:border-dark-border ${
                  row.isDuplicate ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
                }`}
              >
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{formatDate(row.date)}</td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300 truncate max-w-xs">{row.description}</td>
                <td className={`px-3 py-2 text-right font-medium ${
                  row.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {formatCurrency(Math.abs(row.amount))}
                </td>
                <td className="px-3 py-2 text-center">
                  {row.isDuplicate ? (
                    <Badge variant="warning">Duplicata</Badge>
                  ) : (
                    <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
