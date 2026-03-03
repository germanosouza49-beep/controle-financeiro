import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingDown, TrendingUp, AlertTriangle, Calendar } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useCashflow } from '@/hooks/useCashflow'
import { formatCurrency, formatDateShort } from '@/utils/format'

type Period = 30 | 60 | 90

const periodLabels: Record<Period, string> = {
  30: '30 dias',
  60: '60 dias',
  90: '90 dias',
}

function CashflowTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-3 shadow-lg text-sm">
      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex justify-between gap-4">
          <span className="text-gray-500">
            {entry.dataKey === 'projected_balance' ? 'Saldo' : entry.dataKey === 'income' ? 'Receita' : 'Despesa'}
          </span>
          <span className="font-semibold">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Cashflow() {
  const [period, setPeriod] = useState<Period>(30)
  const { data, isLoading } = useCashflow(period)

  const chartData = data?.days.map((d) => ({
    ...d,
    date: formatDateShort(d.date),
  })) ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <Header
        title="Fluxo de caixa"
        subtitle="Projecao financeira baseada em recorrencias, parcelas e faturas"
        actions={
          <div className="flex bg-gray-100 dark:bg-dark-bg rounded-lg p-0.5">
            {([30, 60, 90] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-white dark:bg-dark-card text-brand-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-brand-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Saldo inicial</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.starting_balance)}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                data.ending_balance >= data.starting_balance
                  ? 'bg-income/10'
                  : 'bg-expense/10'
              }`}>
                {data.ending_balance >= data.starting_balance ? (
                  <TrendingUp className="w-6 h-6 text-income" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-expense" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Saldo projetado</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.ending_balance)}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                data.lowest_balance >= 0 ? 'bg-warning/10' : 'bg-expense/10'
              }`}>
                <AlertTriangle className={`w-6 h-6 ${data.lowest_balance >= 0 ? 'text-warning' : 'text-expense'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Menor saldo</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.lowest_balance)}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {formatDateShort(data.lowest_balance_date)}
                </div>
              </div>
              {data.lowest_balance < 0 && (
                <Badge variant="danger" className="ml-auto">Alerta</Badge>
              )}
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Projecao de saldo — {periodLabels[period]}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-gray-500" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    className="text-gray-500"
                  />
                  <Tooltip content={<CashflowTooltip />} />
                  <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="projected_balance"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#balanceGradient)"
                    name="Saldo"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Events timeline */}
          {chartData.some((d) => d.events?.length > 0) && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Eventos previstos</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.days
                  .filter((d) => d.events.length > 0)
                  .flatMap((d) =>
                    d.events.map((ev, idx) => (
                      <div key={`${d.date}-${idx}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${ev.type === 'income' ? 'bg-income' : 'bg-expense'}`} />
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ev.description}</p>
                            <p className="text-xs text-gray-400">{formatDateShort(d.date)} — {ev.source === 'recurring' ? 'Recorrente' : ev.source === 'installment' ? 'Parcela' : ev.source === 'card_due' ? 'Fatura' : 'Planejado'}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${ev.type === 'income' ? 'text-income' : 'text-expense'}`}>
                          {ev.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(ev.amount))}
                        </span>
                      </div>
                    ))
                  )}
              </div>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}
