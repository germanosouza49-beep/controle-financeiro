import { useMemo } from 'react'
import { ArrowRight, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { SummaryCards } from '@/components/charts/SummaryCards'
import { HealthScore } from '@/components/charts/HealthScore'
import { CategoryPieChart } from '@/components/charts/CategoryPieChart'
import { IncomeExpenseLineChart } from '@/components/charts/IncomeExpenseLineChart'
import { TopCategoriesBarChart } from '@/components/charts/TopCategoriesBarChart'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDashboard } from '@/hooks/useDashboard'
import { useAccounts } from '@/hooks/useAccounts'
import { useCards } from '@/hooks/useCards'
import { formatCurrency, formatDateShort, getMonthName } from '@/utils/format'
import { useFilterStore } from '@/store/filterStore'

export default function Dashboard() {
  const { period, setPeriod } = useFilterStore()
  const { data, isLoading } = useDashboard()
  const { data: accounts, isLoading: acLoading } = useAccounts()
  const { data: cards, isLoading: cdLoading } = useCards()

  const summary = data?.summary
  const savings = (summary?.total_income ?? 0) - (summary?.total_expense ?? 0)

  const trendData = useMemo(() => {
    return (data?.trends ?? []).map((t) => ({
      month: `${getMonthName(t.month).slice(0, 3)}/${t.year}`,
      income: t.income,
      expense: t.expense,
    }))
  }, [data?.trends])

  const currentMonth = useMemo(() => {
    const now = new Date()
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <Header
        title="Dashboard"
        subtitle={`Visao geral - ${currentMonth}`}
        actions={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={period.from}
              onChange={(e) => setPeriod(e.target.value, period.to)}
              className="input-field text-sm w-36"
            />
            <span className="text-gray-400 text-sm">ate</span>
            <input
              type="date"
              value={period.to}
              onChange={(e) => setPeriod(period.from, e.target.value)}
              className="input-field text-sm w-36"
            />
          </div>
        }
      />

      {/* Summary Cards */}
      <SummaryCards
        totalBalance={accounts?.reduce((a, c) => a + c.balance, 0) ?? 0}
        totalIncome={summary?.total_income ?? 0}
        totalExpense={summary?.total_expense ?? 0}
        savings={savings}
        loading={isLoading}
      />

      {/* Variation badges */}
      {summary?.vs_previous_month && (
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            {summary.vs_previous_month.income_change_pct >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className="text-gray-500">Receita vs mes anterior:</span>
            <span className={summary.vs_previous_month.income_change_pct >= 0 ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
              {summary.vs_previous_month.income_change_pct >= 0 ? '+' : ''}{summary.vs_previous_month.income_change_pct.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            {summary.vs_previous_month.expense_change_pct <= 0 ? (
              <TrendingDown className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingUp className="w-4 h-4 text-red-500" />
            )}
            <span className="text-gray-500">Despesa vs mes anterior:</span>
            <span className={summary.vs_previous_month.expense_change_pct <= 0 ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
              {summary.vs_previous_month.expense_change_pct >= 0 ? '+' : ''}{summary.vs_previous_month.expense_change_pct.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeExpenseLineChart data={trendData} />
        <CategoryPieChart data={summary?.by_category ?? []} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Categories */}
        <TopCategoriesBarChart data={summary?.by_category?.map((c) => ({ category_name: c.category_name, total: c.total })) ?? []} />

        {/* Recent Transactions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Transacoes recentes</h3>
            <Link to="/transacoes" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))
            ) : data?.recent_transactions?.length ? (
              data.recent_transactions.slice(0, 8).map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 py-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === 'income'
                      ? 'bg-emerald-50 dark:bg-emerald-900/30'
                      : 'bg-red-50 dark:bg-red-900/30'
                  }`}>
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{tx.description}</p>
                    <p className="text-xs text-gray-400">{formatDateShort(tx.date)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${
                    tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Nenhuma transacao encontrada</p>
            )}
          </div>
        </Card>

        {/* Accounts & Cards sidebar */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Contas e cartoes</h3>

          {/* Accounts */}
          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Contas</p>
            {acLoading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
            ) : accounts?.length ? (
              accounts.filter((a) => a.is_active).map((acc) => (
                <div key={acc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: acc.color + '20' }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{acc.bank_name}</p>
                    <p className="text-xs text-gray-400 capitalize">{acc.account_type === 'checking' ? 'Corrente' : acc.account_type === 'savings' ? 'Poupanca' : 'Investimento'}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(acc.balance)}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">Nenhuma conta cadastrada</p>
            )}
          </div>

          {/* Cards */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cartoes</p>
            {cdLoading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
            ) : cards?.length ? (
              cards.filter((c) => c.is_active).map((card) => (
                <div key={card.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.color + '20' }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{card.card_name}</p>
                    <p className="text-xs text-gray-400">**** {card.last_digits}</p>
                  </div>
                  <Badge variant="info">Limite {formatCurrency(card.credit_limit)}</Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">Nenhum cartao cadastrado</p>
            )}
          </div>
        </Card>
      </div>

      {/* Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HealthScore />
      </div>
    </div>
  )
}
