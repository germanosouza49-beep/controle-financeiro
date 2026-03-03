import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { SkeletonCard } from '@/components/ui/Skeleton'

interface SummaryCardsProps {
  totalBalance: number
  totalIncome: number
  totalExpense: number
  savings: number
  loading?: boolean
}

const cards = [
  {
    key: 'balance',
    label: 'Saldo total',
    icon: Wallet,
    gradient: 'from-brand-500 to-brand-700',
    iconBg: 'bg-white/20',
    text: 'text-white',
    subtext: 'text-blue-100',
  },
  {
    key: 'income',
    label: 'Receitas do mes',
    icon: TrendingUp,
    gradient: 'from-emerald-500 to-emerald-700',
    iconBg: 'bg-white/20',
    text: 'text-white',
    subtext: 'text-emerald-100',
  },
  {
    key: 'expense',
    label: 'Despesas do mes',
    icon: TrendingDown,
    gradient: 'from-red-500 to-red-700',
    iconBg: 'bg-white/20',
    text: 'text-white',
    subtext: 'text-red-100',
  },
  {
    key: 'savings',
    label: 'Economia',
    icon: PiggyBank,
    gradient: 'from-amber-500 to-amber-700',
    iconBg: 'bg-white/20',
    text: 'text-white',
    subtext: 'text-amber-100',
  },
] as const

export function SummaryCards({ totalBalance, totalIncome, totalExpense, savings, loading }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  const values: Record<string, number> = {
    balance: totalBalance,
    income: totalIncome,
    expense: totalExpense,
    savings,
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, gradient, iconBg, text, subtext }) => (
        <div
          key={key}
          className={`bg-gradient-to-br ${gradient} rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-medium ${subtext}`}>{label}</span>
            <div className={`${iconBg} p-2 rounded-lg`}>
              <Icon className={`w-5 h-5 ${text}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${text}`}>{formatCurrency(values[key])}</p>
        </div>
      ))}
    </div>
  )
}
