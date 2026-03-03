import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/utils/format'
import { Card } from '@/components/ui/Card'

interface MonthlyData {
  month: string
  income: number
  expense: number
}

interface Props {
  data: MonthlyData[]
  title?: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-100 dark:border-dark-border px-4 py-3">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-medium">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function IncomeExpenseLineChart({ data, title = 'Receitas vs Despesas' }: Props) {
  return (
    <Card className="h-full">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-56 text-sm text-gray-400">
          Sem dados para exibir
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94A3B8" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#94A3B8"
              tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value: string) => <span className="text-gray-600 dark:text-gray-400">{value}</span>}
            />
            <Line type="monotone" dataKey="income" stroke="#10B981" name="Receitas" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="expense" stroke="#EF4444" name="Despesas" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
