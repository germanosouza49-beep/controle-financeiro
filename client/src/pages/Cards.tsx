import { useState, useEffect, FormEvent } from 'react'
import { Plus, CreditCard as CardIcon, Edit2, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useCards, useCreateCard, useUpdateCard, useDeleteCard } from '@/hooks/useCards'
import { apiFetch } from '@/services/api'
import { formatCurrency } from '@/utils/format'
import type { CreditCard } from '@shared/types/api.types'

const colorOptions = ['#8B5CF6', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4', '#F97316']

function CardForm({ initial, onSubmit, loading }: { initial?: Partial<CreditCard>; onSubmit: (d: Partial<CreditCard>) => void; loading?: boolean }) {
  const [cardName, setCardName] = useState(initial?.card_name || '')
  const [lastDigits, setLastDigits] = useState(initial?.last_digits || '')
  const [creditLimit, setCreditLimit] = useState(initial?.credit_limit?.toString() || '')
  const [closingDay, setClosingDay] = useState(initial?.closing_day?.toString() || '1')
  const [dueDay, setDueDay] = useState(initial?.due_day?.toString() || '10')
  const [color, setColor] = useState(initial?.color || '#8B5CF6')

  function handle(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      card_name: cardName,
      last_digits: lastDigits,
      credit_limit: parseFloat(creditLimit),
      closing_day: parseInt(closingDay),
      due_day: parseInt(dueDay),
      color,
    })
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <Input label="Nome do cartao" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Ex: Nubank Platinum..." required />
      <Input label="Ultimos 4 digitos" value={lastDigits} onChange={(e) => setLastDigits(e.target.value)} placeholder="1234" maxLength={4} minLength={4} required />
      <Input label="Limite (R$)" type="number" step="0.01" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Dia de fechamento" type="number" min="1" max="31" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
        <Input label="Dia de vencimento" type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
      </div>
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
        {initial?.id ? 'Salvar' : 'Criar cartao'}
      </Button>
    </form>
  )
}

function getHealthBadge(usedPercent: number) {
  if (usedPercent >= 80) return { variant: 'danger' as const, label: 'Critico' }
  if (usedPercent >= 50) return { variant: 'warning' as const, label: 'Atencao' }
  return { variant: 'success' as const, label: 'Saudavel' }
}

export default function Cards() {
  const { data: cards, isLoading, isError, error, refetch } = useCards()
  const createMutation = useCreateCard()
  const updateMutation = useUpdateCard()
  const deleteMutation = useDeleteCard()
  const [showForm, setShowForm] = useState(false)
  const [editCard, setEditCard] = useState<CreditCard | null>(null)
  const [cardUsage, setCardUsage] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!cards?.length) return
    async function fetchUsage() {
      const usage: Record<string, number> = {}
      for (const card of cards!) {
        try {
          const now = new Date()
          const closingDay = card.closing_day || 1
          // Current billing period: from last closing date to next closing date
          let fromDate: Date
          let toDate: Date
          if (now.getDate() <= closingDay) {
            // We're before closing day: period started last month
            fromDate = new Date(now.getFullYear(), now.getMonth() - 1, closingDay + 1)
            toDate = new Date(now.getFullYear(), now.getMonth(), closingDay)
          } else {
            // We're after closing day: period started this month
            fromDate = new Date(now.getFullYear(), now.getMonth(), closingDay + 1)
            toDate = new Date(now.getFullYear(), now.getMonth() + 1, closingDay)
          }
          const from = fromDate.toISOString().split('T')[0]
          const to = toDate.toISOString().split('T')[0]
          const res = await apiFetch<{ data: Array<{ amount: number }>; pagination: unknown }>(
            `/api/transactions?card_id=${card.id}&from=${from}&to=${to}&page=1&limit=1000`
          )
          const total = (res.data || []).reduce((sum, tx) => sum + Number(tx.amount), 0)
          usage[card.id] = total
        } catch {
          usage[card.id] = 0
        }
      }
      setCardUsage(usage)
    }
    fetchUsage()
  }, [cards])

  return (
    <div className="space-y-6 animate-fade-in">
      <Header
        title="Cartoes de credito"
        subtitle={`${cards?.filter((c) => c.is_active).length ?? 0} cartoes ativos`}
        actions={
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
            Novo cartao
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<CardIcon className="w-16 h-16" />}
          title="Erro ao carregar cartoes"
          description={error?.message || 'Nao foi possivel conectar ao servidor. Verifique se o servidor esta rodando.'}
          action={
            <Button onClick={() => refetch()}>
              Tentar novamente
            </Button>
          }
        />
      ) : !cards?.length ? (
        <EmptyState
          icon={<CardIcon className="w-16 h-16" />}
          title="Nenhum cartao cadastrado"
          description="Adicione seus cartoes de credito para acompanhar faturas e limites."
          action={
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
              Adicionar cartao
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const spent = cardUsage[card.id] || 0
            const usedPercent = card.credit_limit > 0 ? (spent / card.credit_limit) * 100 : 0
            const health = getHealthBadge(usedPercent)

            return (
              <Card key={card.id} hover className="relative overflow-hidden">
                {/* Gradient top bar */}
                <div
                  className="absolute top-0 left-0 w-full h-1.5"
                  style={{ background: `linear-gradient(to right, ${card.color}, ${card.color}88)` }}
                />
                <div className="flex items-start justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.color + '15' }}>
                      <CardIcon className="w-5 h-5" style={{ color: card.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{card.card_name}</p>
                      <p className="text-xs text-gray-400">**** **** **** {card.last_digits}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditCard(card)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remover "${card.card_name}"?`)) deleteMutation.mutate(card.id)
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Limite</span>
                    <Badge variant={health.variant}>{health.label}</Badge>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(card.credit_limit)}</p>
                  <ProgressBar value={usedPercent} max={100} showLabel />

                  <div className="flex justify-between text-xs text-gray-400 pt-1 border-t border-gray-100 dark:border-dark-border">
                    <span>Fecha dia {card.closing_day}</span>
                    <span>Vence dia {card.due_day}</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Novo cartao">
        <CardForm
          onSubmit={(data) => createMutation.mutate(data, { onSuccess: () => setShowForm(false) })}
          loading={createMutation.isPending}
        />
      </Modal>

      <Modal open={!!editCard} onClose={() => setEditCard(null)} title="Editar cartao">
        {editCard && (
          <CardForm
            initial={editCard}
            onSubmit={(data) => updateMutation.mutate({ ...data, id: editCard.id }, { onSuccess: () => setEditCard(null) })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  )
}
