import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/services/api'
import type { CompareResponse } from '@shared/types/api.types'

interface AnalyticsParams {
  period1_from: string
  period1_to: string
  period2_from: string
  period2_to: string
}

export function useAnalytics(params: AnalyticsParams | null) {
  const query = params
    ? new URLSearchParams({
        period1_from: params.period1_from,
        period1_to: params.period1_to,
        period2_from: params.period2_from,
        period2_to: params.period2_to,
      })
    : null

  return useQuery({
    queryKey: ['analytics', params],
    queryFn: () => apiFetch<CompareResponse>(`/api/analytics/compare?${query}`),
    enabled: !!params,
  })
}
