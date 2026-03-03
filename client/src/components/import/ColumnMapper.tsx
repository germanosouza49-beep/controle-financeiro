import { Select } from '@/components/ui/Select'

interface ColumnMapperProps {
  columns: string[]
  mapping: Record<string, string>
  onChange: (mapping: Record<string, string>) => void
}

const targetFields = [
  { value: 'date', label: 'Data' },
  { value: 'description', label: 'Descricao' },
  { value: 'amount', label: 'Valor' },
  { value: 'type', label: 'Tipo (receita/despesa)' },
  { value: '', label: '-- Ignorar --' },
]

export function ColumnMapper({ columns, mapping, onChange }: ColumnMapperProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mapeamento de colunas</h3>
      <p className="text-xs text-gray-400">Associe cada coluna do arquivo ao campo correspondente.</p>
      <div className="space-y-2">
        {columns.map((col) => (
          <div key={col} className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400 w-40 truncate font-mono bg-gray-50 dark:bg-dark-card px-2 py-1 rounded">
              {col}
            </span>
            <span className="text-gray-400">→</span>
            <Select
              value={mapping[col] || ''}
              onChange={(e) => onChange({ ...mapping, [col]: e.target.value })}
              options={targetFields}
              className="flex-1"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
