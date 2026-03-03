import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/services/api'
import type { Category } from '@shared/types/api.types'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<Category[]>('/api/categories'),
    staleTime: 1000 * 60 * 30,
  })
}

export function useCategoryMap() {
  const { data: categories } = useCategories()
  const map = new Map<string, Category>()
  categories?.forEach((c) => map.set(c.id, c))
  return map
}
