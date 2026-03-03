import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/services/api'
import type { ChatMessage, AIInsight, HealthScoreResponse } from '@shared/types/api.types'
import { toast } from '@/components/ui/Toast'

export function useChatHistory() {
  return useQuery({
    queryKey: ['ai', 'chat'],
    queryFn: () => apiFetch<ChatMessage[]>('/api/ai/chat/history'),
  })
}

export function useSendChat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (message: string) =>
      apiFetch<ChatMessage>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'chat'] })
    },
    onError: (e: Error) => toast('error', e.message),
  })
}

export function useAISummary(month: number, year: number) {
  return useQuery({
    queryKey: ['ai', 'summary', month, year],
    queryFn: () => apiFetch<AIInsight>(`/api/ai/summary?month=${month}&year=${year}`),
    enabled: month > 0 && year > 0,
  })
}

export function useAISuggestions() {
  return useQuery({
    queryKey: ['ai', 'suggestions'],
    queryFn: () => apiFetch<AIInsight[]>('/api/ai/suggestions'),
  })
}

export function useAIForecast() {
  return useQuery({
    queryKey: ['ai', 'forecast'],
    queryFn: () => apiFetch<AIInsight>('/api/ai/forecast'),
  })
}

export function useAIAnomalies() {
  return useQuery({
    queryKey: ['ai', 'anomalies'],
    queryFn: () => apiFetch<AIInsight[]>('/api/ai/anomalies'),
  })
}

export function useHealthScore() {
  return useQuery({
    queryKey: ['ai', 'health-score'],
    queryFn: () => apiFetch<HealthScoreResponse>('/api/ai/health-score'),
  })
}

export function useCategorizeBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (transactionIds: string[]) =>
      apiFetch('/api/ai/categorize', {
        method: 'POST',
        body: JSON.stringify({ transaction_ids: transactionIds }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      toast('success', 'Transacoes categorizadas com IA!')
    },
    onError: (e: Error) => toast('error', e.message),
  })
}
