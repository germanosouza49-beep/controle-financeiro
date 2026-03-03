import { ArrowUpRight, ArrowDownRight, Edit2, Trash2, Bot, Split } from 'lucide-react'
import type { Transaction } from '@shared/types/api.types'
import { Badge } from '@/components/ui/Badge'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatCurrency, formatDate } from '@/utils/format'
import { useCategoryMap } from '@/hooks/useCategories'
import { SkeletonTable } from '@/components/ui/Skeleton'

interface TransactionListProps {
  transactions: Transaction[]
  loading?: boolean
  onEdit?: (tx: Transaction) => void
  onDelete?: (tx: Transaction) => void
  onSplit?: (tx: Transaction) => void
}

export function TransactionList({ transactions, loading, onEdit, onDelete, onSplit }: TransactionListProps) {
  const categoryMap = useCategoryMap()

  if (loading) return <SkeletonTable rows={8} />

  if (!transactions.length) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        Nenhuma transacao encontrada
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-dark-border">
            <th className="px-4 py-3 font-medium">Descricao</th>
            <th className="px-4 py-3 font-medium">Categoria</th>
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 font-medium text-right">Valor</th>
            <th className="px-4 py-3 font-medium text-right">Acoes</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const cat = tx.category_id ? categoryMap.get(tx.category_id) : null
            return (
              <tr
                key={tx.id}
                className="border-b border-gray-50 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'
                    }`}>
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{tx.description}</p>
                      {tx.ai_categorized && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Bot className="w-3 h-3 text-brand-400" />
                          <span className="text-[10px] text-brand-500">
                            IA {tx.ai_category_confidence ? `(${(tx.ai_category_confidence * 100).toFixed(0)}%)` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {cat ? (
                    <Badge>
                      <span className="w-2 h-2 rounded-full mr-1.5 inline-block" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">Sem categoria</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(tx.date)}</td>
                <td className={`px-4 py-3 text-sm font-semibold text-right ${
                  tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {onSplit && (
                      <Tooltip content="Dividir">
                        <button
                          onClick={() => onSplit(tx)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <Split className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                        </button>
                      </Tooltip>
                    )}
                    {onEdit && (
                      <Tooltip content="Editar">
                        <button
                          onClick={() => onEdit(tx)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip content="Remover">
                        <button
                          onClick={() => onDelete(tx)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
