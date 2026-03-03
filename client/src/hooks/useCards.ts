import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/services/api'
import type { CreditCard } from '@shared/types/api.types'
import { toast } from '@/components/ui/Toast'

function getErrorMessage(error: Error): string {
  const msg = error.message?.toLowerCase() || ''
  if (msg.includes('load failed') || msg.includes('failed to fetch') || msg.includes('networkerror')) {
    return 'Erro de conexao. Verifique se o servidor esta rodando.'
  }
  return error.message || 'Erro inesperado. Tente novamente.'
}

export function useCards() {
  return useQuery({
    queryKey: ['cards'],
    queryFn: () => apiFetch<CreditCard[]>('/api/cards'),
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  })
}

export function useCreateCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CreditCard>) =>
      apiFetch<CreditCard>('/api/cards', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cards'] })
      toast('success', 'Cartao criado com sucesso!')
    },
    onError: (e: Error) => toast('error', getErrorMessage(e)),
  })
}

export function useUpdateCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CreditCard> & { id: string }) =>
      apiFetch<CreditCard>(`/api/cards/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cards'] })
      toast('success', 'Cartao atualizado!')
    },
    onError: (e: Error) => toast('error', getErrorMessage(e)),
  })
}

export function useDeleteCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/cards/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cards'] })
      toast('success', 'Cartao removido!')
    },
    onError: (e: Error) => toast('error', getErrorMessage(e)),
  })
}
