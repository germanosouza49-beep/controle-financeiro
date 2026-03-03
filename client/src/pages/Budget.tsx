import { useState, FormEvent } from 'react'
import { Plus, PiggyBank, Edit2, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudgets'
import { useCategories } from '@/hooks/useCategories'
import { formatCurrency, getMonthName } from '@/utils/format'
import type { Budget } from '@shared/types/api.types'

function BudgetForm({ initial, onSubmit, loading }: { initial?: Partial<Budget>; onSubmit: (d: Partial<Budget>) => void; loading?: boolean }) {
  const { data: categories } = useCategories()
  const expenseCats = categories?.filter((c) => c.type === 'expense') ?? []
  const now = new Date()

  const [categoryId, setCategoryId] = useState(initial?.category_id || '')
  const [limitAmount, setLimitAmount] = useState(initial?.limit_amount?.toString() || '')
  const [month, setMonth] = useState(initial?.month?.toString() || (now.getMonth() + 1).toString())
  const [year, setYear] = useState(initial?.year?.toString() || now.getFullYear().toString())
  const [alertThreshold, setAlertThreshold] = useState(((initial?.alert_threshold ?? 0.8) * 100).toString())

  function handle(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      category_id: categoryId,
      limit_amount: parseFloat(limitAmount),
      month: parseInt(month),
      year: parseInt(year),
      alert_threshold: parseFloat(alertThreshold) / 100,
    })
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <Select
        label="Categoria"
        placeholder="Selecione..."
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={expenseCats.map((c) => ({ value: c.id, label: c.name }))}
        required
      />
      <Input label="Limite (R$)" type="number" step="0.01" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} required />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Mes"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          options={Array.from({ length: 12 }, (_, i) => ({
            value: (i + 1).toString(),
            label: getMonthName(i + 1),
          }))}
        />
        <Input label="Ano" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
      </div>
      <Input
        label="Alerta quando atingir (%)"
        type="number"
        min="10"
        max="100"
        value={alertThreshold}
        onChange={(e) => setAlertThreshold(e.target.value)}
      />
      <Button type="submit" loading={loading} className="w-full">
        {initial?.id ? 'Salvar' : 'Criar orcamento'}
      </Button>
    </form>
  )
}

export default function BudgetPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())
  const { data: budgetStatuses, isLoading } = useBudgets(month, year)
  const createMutation = useCreateBudget()
  const updateMutation = useUpdateBudget()
  const deleteMutation = useDeleteBudget()
  const [showForm, setShowForm] = useState(false)
  const [editBudget, setEditBudget] = useState<Budget | null>(null)

  return (
    <div className="space-y-6 animate-fade-in">
      <Header
        title="Orcamentos"
        subtitle={`${getMonthName(month)} ${year}`}
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={month.toString()}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              options={Array.from({ length: 12 }, (_, i) => ({
                value: (i + 1).toString(),
                label: getMonthName(i + 1),
              }))}
            />
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
              Novo orcamento
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !budgetStatuses?.length ? (
        <EmptyState
          icon={<PiggyBank className="w-16 h-16" />}
          title="Nenhum orcamento definido"
          description="Defina limites de gastos por categoria para manter suas financas sob controle."
          action={
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
              Criar orcamento
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {budgetStatuses.map((bs) => (
            <Card key={bs.budget.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: (bs.category_color || '#6B7280') + '15' }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bs.category_color || '#6B7280' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{bs.category_name || 'Categoria'}</p>
                    <p className="text-xs text-gray-400">Limite: {formatCurrency(bs.budget.limit_amount)}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditBudget(bs.budget)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Remover orcamento?')) deleteMutation.mutate(bs.budget.id)
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gasto: {formatCurrency(bs.spent)}</span>
                  <span className={`font-medium ${bs.remaining >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    Restante: {formatCurrency(bs.remaining)}
                  </span>
                </div>
                <ProgressBar value={bs.spent} max={bs.budget.limit_amount} showLabel />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Novo orcamento">
        <BudgetForm
          onSubmit={(data) => createMutation.mutate(data, { onSuccess: () => setShowForm(false) })}
          loading={createMutation.isPending}
        />
      </Modal>

      <Modal open={!!editBudget} onClose={() => setEditBudget(null)} title="Editar orcamento">
        {editBudget && (
          <BudgetForm
            initial={editBudget}
            onSubmit={(data) => updateMutation.mutate({ ...data, id: editBudget.id }, { onSuccess: () => setEditBudget(null) })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  )
}
