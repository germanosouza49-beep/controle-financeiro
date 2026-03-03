import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/services/api'
import type { Account } from '@shared/types/api.types'
import { toast } from '@/components/ui/Toast'

function getErrorMessage(error: Error): string {
  const msg = error.message?.toLowerCase() || ''
  if (msg.includes('load failed') || msg.includes('failed to fetch') || msg.includes('networkerror')) {
    return 'Erro de conexao. Verifique se o servidor esta rodando.'
  }
  return error.message || 'Erro inesperado. Tente novamente.'
}

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiFetch<Account[]>('/api/accounts'),
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Account>) =>
      apiFetch<Account>('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
      toast('success', 'Conta criada com sucesso!')
    },
    onError: (e: Error) => toast('error', getErrorMessage(e)),
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Account> & { id: string }) =>
      apiFetch<Account>(`/api/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
      toast('success', 'Conta atualizada!')
    },
    onError: (e: Error) => toast('error', getErrorMessage(e)),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
      toast('success', 'Conta removida!')
    },
    onError: (e: Error) => toast('error', getErrorMessage(e)),
  })
}
