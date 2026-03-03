import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/services/api'
import type { SavingsGoal } from '@shared/types/api.types'
import { toast } from '@/components/ui/Toast'

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => apiFetch<SavingsGoal[]>('/api/goals'),
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<SavingsGoal>) =>
      apiFetch<SavingsGoal>('/api/goals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] })
      toast('success', 'Meta criada com sucesso!')
    },
    onError: (e: Error) => toast('error', e.message),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<SavingsGoal> & { id: string }) =>
      apiFetch<SavingsGoal>(`/api/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] })
      toast('success', 'Meta atualizada!')
    },
    onError: (e: Error) => toast('error', e.message),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/goals/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] })
      toast('success', 'Meta removida!')
    },
    onError: (e: Error) => toast('error', e.message),
  })
}

export function useContributeGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount, source }: { id: string; amount: number; source?: string }) =>
      apiFetch(`/api/goals/${id}/contribute`, {
        method: 'POST',
        body: JSON.stringify({ amount, source }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] })
      toast('success', 'Contribuicao adicionada!')
    },
    onError: (e: Error) => toast('error', e.message),
  })
}
