import { useState, FormEvent } from 'react'
import { Plus, Target, Edit2, Trash2, DollarSign, Calendar, Trophy } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useContributeGoal } from '@/hooks/useGoals'
import { formatCurrency, formatDate } from '@/utils/format'
import type { SavingsGoal } from '@shared/types/api.types'

const colorOptions = ['#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4', '#F97316']

function GoalForm({ initial, onSubmit, loading }: { initial?: Partial<SavingsGoal>; onSubmit: (d: Partial<SavingsGoal>) => void; loading?: boolean }) {
  const [name, setName] = useState(initial?.name || '')
  const [targetAmount, setTargetAmount] = useState(initial?.target_amount?.toString() || '')
  const [deadline, setDeadline] = useState(initial?.deadline || '')
  const [color, setColor] = useState(initial?.color || '#10B981')

  function handle(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      target_amount: parseFloat(targetAmount),
      deadline: deadline || undefined,
      color,
    })
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <Input label="Nome da meta" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Ferias, Reserva de emergencia..." required />
      <Input label="Valor alvo (R$)" type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
      <Input label="Prazo (opcional)" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cor</label>
        <div className="flex gap-2">
          {colorOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <Button type="submit" loading={loading} className="w-full">
        {initial?.id ? 'Salvar' : 'Criar meta'}
      </Button>
    </form>
  )
}

function ContributeForm({ onSubmit, loading }: { onSubmit: (amount: number) => void; loading?: boolean }) {
  const [amount, setAmount] = useState('')

  function handle(e: FormEvent) {
    e.preventDefault()
    onSubmit(parseFloat(amount))
    setAmount('')
  }

  return (
    <form onSubmit={handle} className="flex gap-2">
      <Input
        type="number"
        step="0.01"
        min="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Valor R$"
        required
      />
      <Button type="submit" loading={loading} size="md" icon={<DollarSign className="w-4 h-4" />}>
        Contribuir
      </Button>
    </form>
  )
}

export default function Goals() {
  const { data: goals, isLoading } = useGoals()
  const createMutation = useCreateGoal()
  const updateMutation = useUpdateGoal()
  const deleteMutation = useDeleteGoal()
  const contributeMutation = useContributeGoal()
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null)
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null)

  return (
    <div className="space-y-6 animate-fade-in">
      <Header
        title="Metas de economia"
        subtitle="Acompanhe seu progresso em direcao aos seus objetivos financeiros"
        actions={
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
            Nova meta
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !goals?.length ? (
        <EmptyState
          icon={<Target className="w-16 h-16" />}
          title="Nenhuma meta definida"
          description="Crie metas financeiras para acompanhar seu progresso de economia."
          action={
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
              Criar meta
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map((goal) => {
            return (
              <Card key={goal.id} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: goal.color }} />

                {goal.is_completed && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="success">
                      <Trophy className="w-3 h-3 mr-1" />
                      Concluida!
                    </Badge>
                  </div>
                )}

                <div className="flex items-start justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: goal.color + '15' }}>
                      <Target className="w-5 h-5" style={{ color: goal.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{goal.name}</p>
                      {goal.deadline && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          Ate {formatDate(goal.deadline)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditGoal(goal)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Remover "${goal.name}"?`)) deleteMutation.mutate(goal.id) }}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(goal.current_amount)}</span>
                    <span className="text-sm text-gray-400">de {formatCurrency(goal.target_amount)}</span>
                  </div>
                  <ProgressBar value={goal.current_amount} max={goal.target_amount} showLabel colorByPercent={false} />

                  {!goal.is_completed && (
                    <div className="pt-2 border-t border-gray-100 dark:border-dark-border">
                      {contributeGoalId === goal.id ? (
                        <ContributeForm
                          onSubmit={(amount) => {
                            contributeMutation.mutate({ id: goal.id, amount }, { onSuccess: () => setContributeGoalId(null) })
                          }}
                          loading={contributeMutation.isPending}
                        />
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          icon={<DollarSign className="w-3.5 h-3.5" />}
                          onClick={() => setContributeGoalId(goal.id)}
                        >
                          Adicionar contribuicao
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova meta">
        <GoalForm
          onSubmit={(data) => createMutation.mutate(data as Partial<SavingsGoal>, { onSuccess: () => setShowForm(false) })}
          loading={createMutation.isPending}
        />
      </Modal>

      <Modal open={!!editGoal} onClose={() => setEditGoal(null)} title="Editar meta">
        {editGoal && (
          <GoalForm
            initial={editGoal}
            onSubmit={(data) => updateMutation.mutate({ ...data, id: editGoal.id } as Partial<SavingsGoal> & { id: string }, { onSuccess: () => setEditGoal(null) })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  )
}
