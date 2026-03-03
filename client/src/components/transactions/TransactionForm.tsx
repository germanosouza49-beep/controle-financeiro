import { useState, FormEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useCards } from '@/hooks/useCards'
import type { Transaction } from '@shared/types/api.types'

interface TransactionFormProps {
  initial?: Partial<Transaction>
  onSubmit: (data: Partial<Transaction>) => void
  loading?: boolean
}

export function TransactionForm({ initial, onSubmit, loading }: TransactionFormProps) {
  const [type, setType] = useState(initial?.type || 'expense')
  const [description, setDescription] = useState(initial?.description || '')
  const [amount, setAmount] = useState(initial?.amount?.toString() || '')
  const [date, setDate] = useState(initial?.date || new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState(initial?.category_id || '')
  const [accountId, setAccountId] = useState(initial?.account_id || '')
  const [cardId, setCardId] = useState(initial?.card_id || '')
  const [isRecurring, setIsRecurring] = useState(initial?.is_recurring || false)

  const { data: categories } = useCategories()
  const { data: accounts } = useAccounts()
  const { data: cards } = useCards()

  const filteredCategories = categories?.filter((c) => c.type === type) ?? []

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      type: type as 'income' | 'expense',
      description,
      amount: parseFloat(amount),
      date,
      category_id: categoryId || undefined,
      account_id: accountId || undefined,
      card_id: cardId || undefined,
      is_recurring: isRecurring,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            type === 'expense'
              ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-2 border-red-200 dark:border-red-800'
              : 'bg-gray-50 dark:bg-dark-card text-gray-500 border-2 border-transparent'
          }`}
        >
          Despesa
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            type === 'income'
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-800'
              : 'bg-gray-50 dark:bg-dark-card text-gray-500 border-2 border-transparent'
          }`}
        >
          Receita
        </button>
      </div>

      <Input
        label="Descricao"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Ex: Supermercado, Salario..."
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Valor (R$)"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          required
        />
        <Input
          label="Data"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <Select
        label="Categoria"
        placeholder="Selecione..."
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Conta"
          placeholder="Nenhuma"
          value={accountId}
          onChange={(e) => {
            setAccountId(e.target.value)
            if (e.target.value) setCardId('')
          }}
          options={accounts?.filter((a) => a.is_active).map((a) => ({ value: a.id, label: a.bank_name })) ?? []}
        />
        <Select
          label="Cartao"
          placeholder="Nenhum"
          value={cardId}
          onChange={(e) => {
            setCardId(e.target.value)
            if (e.target.value) setAccountId('')
          }}
          options={cards?.filter((c) => c.is_active).map((c) => ({ value: c.id, label: `${c.card_name} *${c.last_digits}` })) ?? []}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="rounded border-gray-300"
        />
        Transacao recorrente
      </label>

      <Button type="submit" loading={loading} className="w-full">
        {initial?.id ? 'Salvar alteracoes' : 'Criar transacao'}
      </Button>
    </form>
  )
}
