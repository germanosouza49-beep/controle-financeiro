import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useCards } from '@/hooks/useCards'

interface FiltersState {
  search: string
  type: string
  category: string
  account_id: string
  card_id: string
  from: string
  to: string
}

interface TransactionFiltersProps {
  filters: FiltersState
  onChange: (filters: FiltersState) => void
  onClear: () => void
}

export function TransactionFilters({ filters, onChange, onClear }: TransactionFiltersProps) {
  const { data: categories } = useCategories()
  const { data: accounts } = useAccounts()
  const { data: cards } = useCards()

  const hasFilters = filters.search || filters.type || filters.category || filters.account_id || filters.card_id

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <SlidersHorizontal className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtros</span>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} icon={<X className="w-3.5 h-3.5" />}>
            Limpar
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <Input
          placeholder="Buscar descricao..."
          icon={<Search className="w-4 h-4" />}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
        <Select
          placeholder="Tipo"
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value })}
          options={[
            { value: 'income', label: 'Receita' },
            { value: 'expense', label: 'Despesa' },
          ]}
        />
        <Select
          placeholder="Categoria"
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          options={categories?.map((c) => ({ value: c.id, label: c.name })) ?? []}
        />
        <Select
          placeholder="Conta"
          value={filters.account_id}
          onChange={(e) => onChange({ ...filters, account_id: e.target.value })}
          options={accounts?.map((a) => ({ value: a.id, label: a.bank_name })) ?? []}
        />
        <Select
          placeholder="Cartao"
          value={filters.card_id}
          onChange={(e) => onChange({ ...filters, card_id: e.target.value })}
          options={cards?.filter((c) => c.is_active).map((c) => ({ value: c.id, label: `${c.card_name} *${c.last_digits}` })) ?? []}
        />
        <input
          type="date"
          value={filters.from}
          onChange={(e) => onChange({ ...filters, from: e.target.value })}
          className="input-field text-sm"
          placeholder="De"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => onChange({ ...filters, to: e.target.value })}
          className="input-field text-sm"
          placeholder="Ate"
        />
      </div>
    </div>
  )
}
