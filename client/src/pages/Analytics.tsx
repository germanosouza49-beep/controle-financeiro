import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useAnalytics } from '@/hooks/useAnalytics'
import { formatCurrency } from '@/utils/format'

type Preset = 'month' | 'quarter' | 'custom'

function getPresetDates(preset: Preset) {
  const now = new Date()

  if (preset === 'month') {
    const p2Start = new Date(now.getFullYear(), now.getMonth(), 1)
    const p2End = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const p1Start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const p1End = new Date(now.getFullYear(), now.getMonth(), 0)
    return {
      period1_from: fmt(p1Start),
      period1_to: fmt(p1End),
      period2_from: fmt(p2Start),
      period2_to: fmt(p2End),
    }
  }

  // quarter
  const currentQ = Math.floor(now.getMonth() / 3)
  const p2Start = new Date(now.getFullYear(), currentQ * 3, 1)
  const p2End = new Date(now.getFullYear(), currentQ * 3 + 3, 0)
  const p1Start = new Date(now.getFullYear(), (currentQ - 1) * 3, 1)
  const p1End = new Date(now.getFullYear(), (currentQ - 1) * 3 + 3, 0)
  return {
    period1_from: fmt(p1Start),
    period1_to: fmt(p1End),
    period2_from: fmt(p2Start),
    period2_to: fmt(p2End),
  }
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10)
}

function AnalyticsTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-3 shadow-lg text-sm">
      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1 max-w-[200px] truncate">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex justify-between gap-4">
          <span className="text-gray-500">{entry.dataKey === 'period1' ? 'Periodo 1' : 'Periodo 2'}</span>
          <span className="font-semibold">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [preset, setPreset] = useState<Preset>('month')
  const [customDates, setCustomDates] = useState({
    period1_from: '',
    period1_to: '',
    period2_from: '',
    period2_to: '',
  })

  const params = useMemo(() => {
    if (preset === 'custom') {
      if (!customDates.period1_from || !customDates.period1_to || !customDates.period2_from || !customDates.period2_to) {
        return null
      }
      return customDates
    }
    return getPresetDates(preset)
  }, [preset, customDates])

  const { data, isLoading } = useAnalytics(params)

  const chartData = useMemo(() => {
    if (!data?.by_category) return []
    return data.by_category
      .filter((c) => c.period1_total > 0 || c.period2_total > 0)
      .sort((a, b) => (b.period1_total + b.period2_total) - (a.period1_total + a.period2_total))
      .slice(0, 10)
      .map((c) => ({
        name: c.category_name,
        period1: c.period1_total,
        period2: c.period2_total,
      }))
  }, [data])

  const totalVariation = data
    ? ((data.period2.total_expense - data.period1.total_expense) / (data.period1.total_expense || 1)) * 100
    : 0

  const formatPeriodLabel = (from: string, to: string) => {
    const f = new Date(from + 'T12:00:00')
    const t = new Date(to + 'T12:00:00')
    return `${f.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${t.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Header
        title="Analise comparativa"
        subtitle="Compare periodos e identifique tendencias"
        actions={
          <div className="flex bg-gray-100 dark:bg-dark-bg rounded-lg p-0.5">
            {(['month', 'quarter', 'custom'] as Preset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  preset === p
                    ? 'bg-white dark:bg-dark-card text-brand-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {p === 'month' ? 'Mensal' : p === 'quarter' ? 'Trimestral' : 'Personalizado'}
              </button>
            ))}
          </div>
        }
      />

      {/* Custom date pickers */}
      {preset === 'custom' && (
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Periodo 1</p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customDates.period1_from}
                  onChange={(e) => setCustomDates((d) => ({ ...d, period1_from: e.target.value }))}
                  className="input-field text-sm flex-1"
                />
                <span className="text-gray-400 text-sm">ate</span>
                <input
                  type="date"
                  value={customDates.period1_to}
                  onChange={(e) => setCustomDates((d) => ({ ...d, period1_to: e.target.value }))}
                  className="input-field text-sm flex-1"
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Periodo 2</p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customDates.period2_from}
                  onChange={(e) => setCustomDates((d) => ({ ...d, period2_from: e.target.value }))}
                  className="input-field text-sm flex-1"
                />
                <span className="text-gray-400 text-sm">ate</span>
                <input
                  type="date"
                  value={customDates.period2_to}
                  onChange={(e) => setCustomDates((d) => ({ ...d, period2_to: e.target.value }))}
                  className="input-field text-sm flex-1"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Periodo 1</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.period1.total_expense)}</p>
                <p className="text-xs text-gray-400">{formatPeriodLabel(data.period1.from, data.period1.to)}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Periodo 2</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.period2.total_expense)}</p>
                <p className="text-xs text-gray-400">{formatPeriodLabel(data.period2.from, data.period2.to)}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                totalVariation <= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'
              }`}>
                {totalVariation <= 0 ? (
                  <TrendingDown className="w-6 h-6 text-emerald-500" />
                ) : (
                  <TrendingUp className="w-6 h-6 text-red-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Variacao</p>
                <p className={`text-xl font-bold ${totalVariation <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {totalVariation >= 0 ? '+' : ''}{totalVariation.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">
                  {totalVariation <= 0 ? 'Reducao nos gastos' : 'Aumento nos gastos'}
                </p>
              </div>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Comparativo por categoria
            </h3>
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      className="text-gray-500"
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                      className="text-gray-500"
                    />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12 }}
                      formatter={(value: string) => (
                        <span className="text-gray-600 dark:text-gray-400">
                          {value === 'period1' ? 'Periodo 1' : 'Periodo 2'}
                        </span>
                      )}
                    />
                    <Bar dataKey="period1" fill="#3B82F6" radius={[4, 4, 0, 0]} name="period1" />
                    <Bar dataKey="period2" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="period2" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-56 text-sm text-gray-400">
                Sem dados para exibir
              </div>
            )}
          </Card>

          {/* Category comparison table */}
          <Card padding={false}>
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detalhamento por categoria</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-dark-border">
                    <th className="px-5 py-3 font-medium">Categoria</th>
                    <th className="px-5 py-3 font-medium text-right">Periodo 1</th>
                    <th className="px-5 py-3 font-medium text-right">Periodo 2</th>
                    <th className="px-5 py-3 font-medium text-right">Variacao</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_category
                    .filter((c) => c.period1_total > 0 || c.period2_total > 0)
                    .sort((a, b) => Math.abs(b.percentage_change) - Math.abs(a.percentage_change))
                    .map((cat) => (
                      <tr key={cat.category_id} className="border-b border-gray-50 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.category_color }} />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{cat.category_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                          {formatCurrency(cat.period1_total)}
                        </td>
                        <td className="px-5 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                          {formatCurrency(cat.period2_total)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {cat.percentage_change > 0 ? (
                              <ArrowUpRight className="w-4 h-4 text-red-500" />
                            ) : cat.percentage_change < 0 ? (
                              <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                            ) : null}
                            <span className={`text-sm font-semibold ${
                              cat.percentage_change > 0 ? 'text-red-500' : cat.percentage_change < 0 ? 'text-emerald-600' : 'text-gray-400'
                            }`}>
                              {cat.percentage_change >= 0 ? '+' : ''}{cat.percentage_change.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI narrative */}
          {data.ai_narrative && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Analise da IA</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{data.ai_narrative}</p>
            </Card>
          )}
        </>
      ) : preset === 'custom' ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <BarChart3 className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">Selecione os dois periodos para comparar</p>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
