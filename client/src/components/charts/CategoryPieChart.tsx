import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/utils/format'
import { Card } from '@/components/ui/Card'
import type { CategoryTotal } from '@shared/types/api.types'

interface CategoryPieChartProps {
  data: CategoryTotal[]
  title?: string
}

const FALLBACK_COLORS = ['#2563EB', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1']

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: CategoryTotal; value: number }[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-100 dark:border-dark-border px-3 py-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.payload.category_name}</p>
      <p className="text-sm text-gray-500">{formatCurrency(item.value)} ({item.payload.percentage?.toFixed(1)}%)</p>
    </div>
  )
}

export function CategoryPieChart({ data, title = 'Gastos por categoria' }: CategoryPieChartProps) {
  return (
    <Card className="h-full">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-56 text-sm text-gray-400">
          Sem dados para exibir
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="total"
                >
                  {data.map((item, i) => (
                    <Cell key={i} fill={item.category_color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2 max-h-48 overflow-y-auto">
            {data.map((item, i) => (
              <div key={item.category_id} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.category_color || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
                />
                <span className="flex-1 text-gray-600 dark:text-gray-400 truncate">{item.category_name}</span>
                <span className="text-gray-500 text-xs">{item.percentage?.toFixed(1)}%</span>
                <span className="font-medium text-gray-700 dark:text-gray-300 w-24 text-right">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
