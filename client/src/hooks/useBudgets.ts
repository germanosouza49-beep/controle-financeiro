import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/services/api'
import type { Budget, BudgetStatus } from '@shared/types/api.types'
import { toast } from '@/components/ui/Toast'

export function useBudgets(month?: number, year?: number) {
  const params = new URLSearchParams()
  if (month) params.set('month', String(month))
  if (year) params.set('year', String(year))
  const qs = params.toString()

  return useQuery({
    queryKey: ['budgets', month, year],
    queryFn: () => apiFetch<BudgetStatus[]>(`/api/budgets${qs ? `?${qs}` : ''}`),
  })
}

export function useCreateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Budget>) =>
      apiFetch<Budget>('/api/budgets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] })
      toast('success', 'Orcamento criado!')
    },
    onError: (e: Error) => toast('error', e.message),
  })
}

export function useUpdateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Budget> & { id: string }) =>
      apiFetch<Budget>(`/api/budgets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] })
      toast('success', 'Orcamento atualizado!')
    },
    onError: (e: Error) => toast('error', e.message),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/budgets/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] })
      toast('success', 'Orcamento removido!')
    },
    onError: (e: Error) => toast('error', e.message),
  })
}
