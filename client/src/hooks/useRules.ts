import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/services/api'
import type { CategorizationRule } from '@shared/types/api.types'
import { toast } from '@/components/ui/Toast'

export function useRules() {
  return useQuery({
    queryKey: ['rules'],
    queryFn: () => apiFetch<CategorizationRule[]>('/api/rules'),
  })
}

export function useCreateRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CategorizationRule>) =>
      apiFetch<CategorizationRule>('/api/rules', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rules'] })
      toast('success', 'Regra criada!')
    },
    onError: (e: Error) => toast('error', e.message),
  })
}

export function useUpdateRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CategorizationRule> & { id: string }) =>
      apiFetch<CategorizationRule>(`/api/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rules'] })
      toast('success', 'Regra atualizada!')
    },
    onError: (e: Error) => toast('error', e.message),
  })
}

export function useDeleteRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rules'] })
      toast('success', 'Regra removida!')
    },
    onError: (e: Error) => toast('error', e.message),
  })
}
