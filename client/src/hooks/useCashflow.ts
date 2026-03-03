import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/services/api'
import type { CashflowResponse } from '@shared/types/api.types'

export function useCashflow(days: 30 | 60 | 90 = 30) {
  return useQuery({
    queryKey: ['cashflow', days],
    queryFn: () => apiFetch<CashflowResponse>(`/api/cashflow?days=${days}`),
  })
}
