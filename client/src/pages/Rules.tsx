import { useState, FormEvent } from 'react'
import { Plus, Edit2, Trash2, Filter, Zap, ToggleLeft, ToggleRight } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useRules, useCreateRule, useUpdateRule, useDeleteRule } from '@/hooks/useRules'
import { useCategories } from '@/hooks/useCategories'
import type { CategorizationRule, MatchType } from '@shared/types/api.types'

const matchTypeLabels: Record<MatchType, string> = {
  contains: 'Contem',
  starts_with: 'Comeca com',
  ends_with: 'Termina com',
  regex: 'Regex',
  exact: 'Exato',
}

const matchTypeOptions = Object.entries(matchTypeLabels).map(([value, label]) => ({ value, label }))

function RuleForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<CategorizationRule>
  onSubmit: (d: Partial<CategorizationRule>) => void
  loading?: boolean
}) {
  const { data: categories } = useCategories()
  const [pattern, setPattern] = useState(initial?.pattern || '')
  const [matchType, setMatchType] = useState<string>(initial?.match_type || 'contains')
  const [categoryId, setCategoryId] = useState(initial?.category_id || '')
  const [priority, setPriority] = useState(initial?.priority?.toString() || '0')

  function handle(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      pattern,
      match_type: matchType as MatchType,
      category_id: categoryId,
      priority: parseInt(priority),
    })
  }

  const categoryOptions = (categories ?? []).map((c) => ({
    value: c.id,
    label: `${c.name} (${c.type === 'income' ? 'Receita' : 'Despesa'})`,
  }))

  return (
    <form onSubmit={handle} className="space-y-4">
      <Input
        label="Padrao de texto"
        value={pattern}
        onChange={(e) => setPattern(e.target.value)}
        placeholder="Ex: UBER, MERCADO, NETFLIX..."
        required
      />
      <Select
        label="Tipo de correspondencia"
        value={matchType}
        onChange={(e) => setMatchType(e.target.value)}
        options={matchTypeOptions}
      />
      <Select
        label="Categoria"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categoryOptions}
        placeholder="Selecione a categoria"
        required
      />
      <Input
        label="Prioridade (maior = mais importante)"
        type="number"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        min={0}
        max={100}
      />
      <Button type="submit" loading={loading} className="w-full">
        {initial?.id ? 'Salvar alteracoes' : 'Criar regra'}
      </Button>
    </form>
  )
}

export default function Rules() {
  const { data: rules, isLoading } = useRules()
  const { data: categories } = useCategories()
  const createMutation = useCreateRule()
  const updateMutation = useUpdateRule()
  const deleteMutation = useDeleteRule()
  const [showForm, setShowForm] = useState(false)
  const [editRule, setEditRule] = useState<CategorizationRule | null>(null)

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c]))

  const sortedRules = [...(rules ?? [])].sort((a, b) => b.priority - a.priority)

  return (
    <div className="space-y-6 animate-fade-in">
      <Header
        title="Regras de categorizacao"
        subtitle="Configure regras automaticas para categorizar transacoes por padrao de texto"
        actions={
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
            Nova regra
          </Button>
        }
      />

      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Regras rodam antes da IA — economia de custo!
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Transacoes correspondentes sao categorizadas instantaneamente sem usar creditos de IA.
            </p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !sortedRules.length ? (
        <EmptyState
          icon={<Filter className="w-16 h-16" />}
          title="Nenhuma regra definida"
          description="Crie regras para categorizar automaticamente suas transacoes importadas."
          action={
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
              Criar regra
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Padrao</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Tipo</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Categoria</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase py-3 px-4">Prioridade</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase py-3 px-4">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase py-3 px-4">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {sortedRules.map((rule) => {
                  const cat = categoryMap.get(rule.category_id)
                  return (
                    <tr key={rule.id} className="border-b border-gray-50 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <code className="text-sm font-mono bg-gray-100 dark:bg-dark-bg px-2 py-0.5 rounded">{rule.pattern}</code>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="default">{matchTypeLabels[rule.match_type]}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {cat ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rule.priority}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => updateMutation.mutate({ id: rule.id, is_active: !rule.is_active })}
                          className="inline-flex items-center"
                        >
                          {rule.is_active ? (
                            <ToggleRight className="w-6 h-6 text-income" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setEditRule(rule)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-gray-400" />
                          </button>
                          {!rule.is_system && (
                            <button
                              onClick={() => { if (confirm(`Remover regra "${rule.pattern}"?`)) deleteMutation.mutate(rule.id) }}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova regra">
        <RuleForm
          onSubmit={(data) => createMutation.mutate(data as Partial<CategorizationRule>, { onSuccess: () => setShowForm(false) })}
          loading={createMutation.isPending}
        />
      </Modal>

      <Modal open={!!editRule} onClose={() => setEditRule(null)} title="Editar regra">
        {editRule && (
          <RuleForm
            initial={editRule}
            onSubmit={(data) => updateMutation.mutate({ ...data, id: editRule.id } as Partial<CategorizationRule> & { id: string }, { onSuccess: () => setEditRule(null) })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  )
}
