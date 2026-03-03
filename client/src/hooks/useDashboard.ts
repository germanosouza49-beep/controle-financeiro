import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/services/api'
import { useFilterStore } from '@/store/filterStore'
import type { TransactionSummary, MonthlyTrend, Transaction } from '@shared/types/api.types'

interface DashboardSummaryResponse {
  summary: TransactionSummary
  trends: MonthlyTrend[]
  recent_transactions: Transaction[]
}

export function useDashboard() {
  const { period, accountId, cardId } = useFilterStore()
  const params = new URLSearchParams()
  params.set('from', period.from)
  params.set('to', period.to)
  if (accountId) params.set('account_id', accountId)
  if (cardId) params.set('card_id', cardId)

  return useQuery({
    queryKey: ['dashboard', period, accountId, cardId],
    queryFn: () => apiFetch<DashboardSummaryResponse>(`/api/transactions/summary?${params}`),
  })
}
