import { useState, FormEvent } from 'react'
import { Plus, Building2, Edit2, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/hooks/useAccounts'
import { formatCurrency } from '@/utils/format'
import type { Account } from '@shared/types/api.types'

const accountTypeLabels: Record<string, string> = {
  checking: 'Corrente',
  savings: 'Poupanca',
  investment: 'Investimento',
}

const colorOptions = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']

const scopeLabels: Record<string, string> = {
  personal: 'PF',
  business: 'PJ',
}

function AccountForm({ initial, onSubmit, loading }: { initial?: Partial<Account>; onSubmit: (d: Partial<Account>) => void; loading?: boolean }) {
  const [bankName, setBankName] = useState(initial?.bank_name || '')
  const [accountType, setAccountType] = useState<string>(initial?.account_type || 'checking')
  const [balance, setBalance] = useState(initial?.balance?.toString() || '0')
  const [color, setColor] = useState(initial?.color || '#3B82F6')
  const [scope, setScope] = useState<string>(initial?.scope || 'personal')

  function handle(e: FormEvent) {
    e.preventDefault()
    onSubmit({ bank_name: bankName, account_type: accountType as Account['account_type'], balance: parseFloat(balance), color, scope: scope as Account['scope'] })
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <Input label="Nome do banco" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ex: Nubank, Itau..." required />
      <Select
        label="Tipo de conta"
        value={accountType}
        onChange={(e) => setAccountType(e.target.value)}
        options={[
          { value: 'checking', label: 'Corrente' },
          { value: 'savings', label: 'Poupanca' },
          { value: 'investment', label: 'Investimento' },
        ]}
      />
      <Select
        label="Escopo"
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        options={[
          { value: 'personal', label: 'Pessoa Fisica (PF)' },
          { value: 'business', label: 'Pessoa Juridica (PJ)' },
        ]}
      />
      <Input label="Saldo inicial (R$)" type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
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
        {initial?.id ? 'Salvar' : 'Criar conta'}
      </Button>
    </form>
  )
}

export default function Accounts() {
  const { data: accounts, isLoading, isError, error, refetch } = useAccounts()
  const createMutation = useCreateAccount()
  const updateMutation = useUpdateAccount()
  const deleteMutation = useDeleteAccount()
  const [showForm, setShowForm] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)

  const totalBalance = accounts?.filter((a) => a.is_active).reduce((a, c) => a + c.balance, 0) ?? 0

  return (
    <div className="space-y-6 animate-fade-in">
      <Header
        title="Contas bancarias"
        subtitle={`Saldo total: ${formatCurrency(totalBalance)}`}
        actions={
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
            Nova conta
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Building2 className="w-16 h-16" />}
          title="Erro ao carregar contas"
          description={error?.message || 'Nao foi possivel conectar ao servidor. Verifique se o servidor esta rodando.'}
          action={
            <Button onClick={() => refetch()}>
              Tentar novamente
            </Button>
          }
        />
      ) : !accounts?.length ? (
        <EmptyState
          icon={<Building2 className="w-16 h-16" />}
          title="Nenhuma conta cadastrada"
          description="Adicione suas contas bancarias para comecar a acompanhar suas financas."
          action={
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
              Adicionar conta
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <Card key={acc.id} hover className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: acc.color }} />
              <div className="flex items-start justify-between mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: acc.color + '15' }}>
                    <Building2 className="w-5 h-5" style={{ color: acc.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{acc.bank_name}</p>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={acc.is_active ? 'success' : 'default'}>
                        {accountTypeLabels[acc.account_type]}
                      </Badge>
                      <Badge variant={acc.scope === 'business' ? 'info' : 'default'}>
                        {scopeLabels[acc.scope] || 'PF'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditAccount(acc)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remover "${acc.bank_name}"?`)) deleteMutation.mutate(acc.id)
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-400">Saldo</p>
                <p className={`text-2xl font-bold ${acc.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                  {formatCurrency(acc.balance)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova conta">
        <AccountForm
          onSubmit={(data) => createMutation.mutate(data, { onSuccess: () => setShowForm(false) })}
          loading={createMutation.isPending}
        />
      </Modal>

      <Modal open={!!editAccount} onClose={() => setEditAccount(null)} title="Editar conta">
        {editAccount && (
          <AccountForm
            initial={editAccount}
            onSubmit={(data) => updateMutation.mutate({ ...data, id: editAccount.id }, { onSuccess: () => setEditAccount(null) })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  )
}
