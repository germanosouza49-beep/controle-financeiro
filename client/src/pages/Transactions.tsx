import { useState, useMemo } from 'react'
import { Plus, ChevronLeft, ChevronRight, FileText, FileSpreadsheet, Bot } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { TransactionList } from '@/components/transactions/TransactionList'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { SplitModal } from '@/components/transactions/SplitModal'
import { CategoryReviewCard } from '@/components/ai/CategoryReviewCard'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions'
import { useExport } from '@/hooks/useExport'
import { useCategoryMap } from '@/hooks/useCategories'
import { classNames } from '@/utils/format'
import type { Transaction } from '@shared/types/api.types'

const LIMIT = 20

const defaultFilters = {
  search: '',
  type: '',
  category: '',
  account_id: '',
  card_id: '',
  from: '',
  to: '',
}

type Tab = 'all' | 'review'

export default function Transactions() {
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [splitTx, setSplitTx] = useState<Transaction | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('all')

  const { data, isLoading } = useTransactions({
    page,
    limit: LIMIT,
    search: filters.search || undefined,
    type: (filters.type as 'income' | 'expense') || undefined,
    category: filters.category || undefined,
    account_id: filters.account_id || undefined,
    card_id: filters.card_id || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  })

  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const deleteMutation = useDeleteTransaction()
  const { download: exportDownload, loading: exportLoading } = useExport()
  const categoryMap = useCategoryMap()

  const transactions = data?.data ?? []
  const total = data?.pagination?.total ?? 0
  const totalPages = data?.pagination?.totalPages ?? Math.ceil(total / LIMIT)

  const pendingReview = useMemo(() =>
    transactions.filter(
      (tx) => tx.ai_categorized && tx.ai_category_confidence !== null && tx.ai_category_confidence < 0.85
    ),
    [transactions]
  )

  function handleCreate(txData: Partial<Transaction>) {
    createMutation.mutate(txData, {
      onSuccess: () => setShowForm(false),
    })
  }

  function handleUpdate(txData: Partial<Transaction>) {
    if (!editTx) return
    updateMutation.mutate({ ...txData, id: editTx.id }, {
      onSuccess: () => setEditTx(null),
    })
  }

  function handleDelete(tx: Transaction) {
    if (confirm(`Remover "${tx.description}"?`)) {
      deleteMutation.mutate(tx.id)
    }
  }

  function handleAcceptCategory(tx: Transaction) {
    updateMutation.mutate({
      id: tx.id,
      ai_category_confidence: 1,
    })
  }

  function handleRejectCategory(tx: Transaction) {
    setEditTx(tx)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <Header
        title="Transacoes"
        subtitle={`${total} transacoes encontradas`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<FileText className="w-4 h-4" />}
              onClick={() => exportDownload('pdf', { from: filters.from, to: filters.to })}
              loading={exportLoading}
            >
              PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4" />}
              onClick={() => exportDownload('excel', { from: filters.from, to: filters.to })}
              loading={exportLoading}
            >
              Excel
            </Button>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
              Nova transacao
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-100 dark:border-dark-border">
        <button
          onClick={() => setActiveTab('all')}
          className={classNames(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'all'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
          )}
        >
          Todas
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={classNames(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'review'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
          )}
        >
          <Bot className="w-4 h-4" />
          Pendentes de revisao
          {pendingReview.length > 0 && (
            <Badge variant="warning">{pendingReview.length}</Badge>
          )}
        </button>
      </div>

      {activeTab === 'all' ? (
        <>
          <TransactionFilters
            filters={filters}
            onChange={(f) => {
              setFilters(f)
              setPage(1)
            }}
            onClear={() => {
              setFilters(defaultFilters)
              setPage(1)
            }}
          />

          <div className="card">
            <TransactionList
              transactions={transactions}
              loading={isLoading}
              onEdit={(tx) => setEditTx(tx)}
              onDelete={handleDelete}
              onSplit={(tx) => setSplitTx(tx)}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-dark-border">
                <p className="text-sm text-gray-500">
                  Pagina {page} de {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    icon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Proxima
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {pendingReview.length === 0 ? (
            <EmptyState
              icon={<Bot className="w-16 h-16" />}
              title="Nenhuma transacao pendente de revisao"
              description="Todas as transacoes categorizadas pela IA estao com confianca alta. Novas transacoes com baixa confianca aparecerão aqui."
            />
          ) : (
            pendingReview.map((tx) => {
              const cat = tx.category_id ? categoryMap.get(tx.category_id) : null
              return (
                <CategoryReviewCard
                  key={tx.id}
                  description={tx.description}
                  amount={tx.amount}
                  suggestedCategory={cat?.name || 'Sem categoria'}
                  confidence={tx.ai_category_confidence || 0}
                  onAccept={() => handleAcceptCategory(tx)}
                  onReject={() => handleRejectCategory(tx)}
                />
              )
            })
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova transacao" size="lg">
        <TransactionForm onSubmit={handleCreate} loading={createMutation.isPending} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTx} onClose={() => setEditTx(null)} title="Editar transacao" size="lg">
        {editTx && (
          <TransactionForm
            initial={editTx}
            onSubmit={handleUpdate}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Split Modal */}
      <SplitModal transaction={splitTx} onClose={() => setSplitTx(null)} />
    </div>
  )
}
