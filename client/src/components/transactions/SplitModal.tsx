import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/format'
import { useCreateSplit } from '@/hooks/useSplits'
import type { Transaction } from '@shared/types/api.types'

interface SplitModalProps {
  transaction: Transaction | null
  onClose: () => void
}

interface SplitEntry {
  member_id: string
  percentage: number
}

export function SplitModal({ transaction, onClose }: SplitModalProps) {
  const [splits, setSplits] = useState<SplitEntry[]>([
    { member_id: '', percentage: 50 },
    { member_id: '', percentage: 50 },
  ])
  const createSplit = useCreateSplit()

  if (!transaction) return null

  const totalPercentage = splits.reduce((sum, s) => sum + s.percentage, 0)
  const isValid = splits.every((s) => s.member_id.trim()) && Math.abs(totalPercentage - 100) < 0.01

  function addMember() {
    setSplits((prev) => [...prev, { member_id: '', percentage: 0 }])
  }

  function removeMember(index: number) {
    if (splits.length <= 2) return
    setSplits((prev) => prev.filter((_, i) => i !== index))
  }

  function updateSplit(index: number, field: keyof SplitEntry, value: string | number) {
    setSplits((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    )
  }

  function distributeEvenly() {
    const pct = Math.floor((100 / splits.length) * 100) / 100
    const remainder = 100 - pct * (splits.length - 1)
    setSplits((prev) =>
      prev.map((s, i) => ({ ...s, percentage: i === 0 ? remainder : pct }))
    )
  }

  function handleSubmit() {
    if (!isValid || !transaction) return
    createSplit.mutate(
      {
        transactionId: transaction.id,
        data: {
          splits: splits.map((s) => ({
            member_id: s.member_id.trim(),
            percentage: s.percentage,
          })),
        },
      },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <Modal open={!!transaction} onClose={onClose} title="Dividir transacao" size="lg">
      <div className="space-y-4">
        {/* Transaction summary */}
        <div className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{transaction.description}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(Math.abs(transaction.amount))}
          </p>
        </div>

        {/* Split entries */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Membros</p>
            <Button variant="ghost" size="sm" onClick={distributeEvenly}>
              Distribuir igualmente
            </Button>
          </div>

          {splits.map((split, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nome do membro"
                value={split.member_id}
                onChange={(e) => updateSplit(index, 'member_id', e.target.value)}
                className="input-field text-sm flex-1"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={split.percentage}
                  onChange={(e) => updateSplit(index, 'percentage', parseFloat(e.target.value) || 0)}
                  className="input-field text-sm w-20 text-right"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              <span className="text-sm text-gray-500 w-24 text-right">
                {formatCurrency(Math.abs(transaction.amount) * (split.percentage / 100))}
              </span>
              {splits.length > 2 && (
                <button
                  onClick={() => removeMember(index)}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addMember}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar membro
        </button>

        {/* Total indicator */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-dark-border">
          <span className="text-sm text-gray-500">Total</span>
          <span className={`text-sm font-semibold ${Math.abs(totalPercentage - 100) < 0.01 ? 'text-emerald-600' : 'text-red-500'}`}>
            {totalPercentage.toFixed(1)}%
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            loading={createSplit.isPending}
          >
            Dividir
          </Button>
        </div>
      </div>
    </Modal>
  )
}
