import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/utils/format'
import { Card } from '@/components/ui/Card'

interface BarData {
  category_name: string
  total: number
}

interface Props {
  data: BarData[]
  title?: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-100 dark:border-dark-border px-3 py-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</p>
      <p className="text-sm text-gray-500">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function TopCategoriesBarChart({ data, title = 'Top categorias' }: Props) {
  const top5 = data.slice(0, 5)

  return (
    <Card className="h-full">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      {top5.length === 0 ? (
        <div className="flex items-center justify-center h-56 text-sm text-gray-400">
          Sem dados para exibir
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={top5} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94A3B8" tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="category_name" tick={{ fontSize: 12 }} stroke="#94A3B8" width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" fill="#2563EB" radius={[0, 6, 6, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
