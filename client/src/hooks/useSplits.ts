import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/services/api'
import { toast } from '@/components/ui/Toast'
import type { CreateSplitRequest } from '@shared/types/api.types'

interface SplitBalance {
  member_id: string
  total_owed: number
  total_paid: number
  net: number
}

interface SplitBalanceResponse {
  balances: SplitBalance[]
}

export function useSplitBalance() {
  return useQuery({
    queryKey: ['splits', 'balance'],
    queryFn: () => apiFetch<SplitBalanceResponse>('/api/splits/balance'),
  })
}

export function useCreateSplit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ transactionId, data }: { transactionId: string; data: CreateSplitRequest }) =>
      apiFetch(`/api/splits/${transactionId}/split`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast('success', 'Transacao dividida com sucesso!')
    },
    onError: (err: Error) => {
      toast('error', err.message || 'Erro ao dividir transacao')
    },
  })
}
