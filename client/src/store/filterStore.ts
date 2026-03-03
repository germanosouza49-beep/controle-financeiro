import { create } from 'zustand'

interface FilterState {
  period: { from: string; to: string }
  accountId: string | null
  cardId: string | null
  categoryId: string | null
  setPeriod: (from: string, to: string) => void
  setAccountId: (id: string | null) => void
  setCardId: (id: string | null) => void
  setCategoryId: (id: string | null) => void
  resetFilters: () => void
}

function getDefaultPeriod() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return { from, to }
}

export const useFilterStore = create<FilterState>((set) => ({
  period: getDefaultPeriod(),
  accountId: null,
  cardId: null,
  categoryId: null,
  setPeriod: (from, to) => set({ period: { from, to } }),
  setAccountId: (accountId) => set({ accountId }),
  setCardId: (cardId) => set({ cardId }),
  setCategoryId: (categoryId) => set({ categoryId }),
  resetFilters: () => set({ ...getDefaultPeriod(), accountId: null, cardId: null, categoryId: null }),
}))
