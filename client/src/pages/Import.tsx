import { useState } from 'react'
import { Upload, FileSpreadsheet, FileText, ArrowRight, Check, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { FileUpload } from '@/components/import/FileUpload'
import { ColumnMapper } from '@/components/import/ColumnMapper'
import { ImportPreview } from '@/components/import/ImportPreview'
import { apiFetch } from '@/services/api'
import { toast } from '@/components/ui/Toast'
import { useAccounts } from '@/hooks/useAccounts'
import { useCards } from '@/hooks/useCards'
import { useQueryClient } from '@tanstack/react-query'

type Step = 'upload' | 'mapping' | 'preview' | 'done'

interface PreviewRow {
  date: string
  description: string
  amount: number
  type: string
  isDuplicate?: boolean
}

export default function Import() {
  const [importType, setImportType] = useState<'csv' | 'pdf'>('csv')
  const [documentType, setDocumentType] = useState<'extrato' | 'fatura'>('extrato')
  const [step, setStep] = useState<Step>('upload')
  const [columns, setColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [duplicateCount, setDuplicateCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [accountId, setAccountId] = useState('')
  const [cardId, setCardId] = useState('')

  const { data: accounts } = useAccounts()
  const { data: cards } = useCards()
  const qc = useQueryClient()

  async function handleFileSelected(f: File) {
    setLoading(true)

    try {
      if (importType === 'csv') {
        const formData = new FormData()
        formData.append('file', f)
        const result = await apiFetch<{ columns: string[]; preview: PreviewRow[]; duplicates: number }>('/api/import/csv', {
          method: 'POST',
          body: formData,
          headers: {},
        })
        setColumns(result.columns)
        setPreview(result.preview)
        setDuplicateCount(result.duplicates)
        // Auto-map common column names
        const autoMap: Record<string, string> = {}
        result.columns.forEach((col) => {
          const lower = col.toLowerCase()
          if (lower.includes('data') || lower.includes('date')) autoMap[col] = 'date'
          else if (lower.includes('descri') || lower.includes('desc') || lower.includes('historico')) autoMap[col] = 'description'
          else if (lower.includes('valor') || lower.includes('amount') || lower.includes('value')) autoMap[col] = 'amount'
          else if (lower.includes('tipo') || lower.includes('type')) autoMap[col] = 'type'
        })
        setMapping(autoMap)
        setStep('mapping')
      } else {
        const formData = new FormData()
        formData.append('file', f)
        if (cardId) formData.append('card_id', cardId)
        const result = await apiFetch<{ preview: PreviewRow[]; duplicates: number }>('/api/import/pdf', {
          method: 'POST',
          body: formData,
          headers: {},
        })
        setPreview(result.preview)
        setDuplicateCount(result.duplicates)
        setStep('preview')
      }
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erro ao processar arquivo')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    // Validação client-side: conta ou cartão obrigatório conforme tipo de documento
    if (documentType === 'extrato' && !accountId) {
      toast('error', 'Selecione a conta de destino')
      return
    }
    if (documentType === 'fatura' && !cardId) {
      toast('error', 'Selecione o cartao de credito')
      return
    }

    setLoading(true)
    try {
      const nonDuplicates = preview
        .filter(r => !r.isDuplicate)
        .map(({ date, description, amount, type }) => ({ date, description, amount, type }))
      const endpoint = importType === 'csv' ? '/api/import/csv/confirm' : '/api/import/pdf/confirm'
      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          transactions: nonDuplicates,
          account_id: accountId || undefined,
          card_id: cardId || undefined,
        }),
      })
      setStep('done')
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast('success', `${preview.filter((r) => !r.isDuplicate).length} transacoes importadas com sucesso!`)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erro ao confirmar importacao')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep('upload')
    setColumns([])
    setMapping({})
    setPreview([])
    setDuplicateCount(0)
    setAccountId('')
    setCardId('')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Importar dados" subtitle="Importe transacoes de CSV, planilhas ou faturas PDF" />

      {/* File format selector */}
      <div className="flex gap-3">
        <Card
          hover
          onClick={() => { setImportType('csv'); reset() }}
          className={`flex-1 flex items-center gap-4 cursor-pointer ${importType === 'csv' ? 'ring-2 ring-brand-500' : ''}`}
        >
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-white">CSV / Planilha</p>
            <p className="text-xs text-gray-400">Arquivo CSV, XLSX ou XLS</p>
          </div>
        </Card>
        <Card
          hover
          onClick={() => { setImportType('pdf'); reset() }}
          className={`flex-1 flex items-center gap-4 cursor-pointer ${importType === 'pdf' ? 'ring-2 ring-brand-500' : ''}`}
        >
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-white">PDF</p>
            <p className="text-xs text-gray-400">Arquivo em formato PDF</p>
          </div>
        </Card>
      </div>

      {/* Document type selector */}
      <div className="flex gap-3">
        <Card
          hover
          onClick={() => { setDocumentType('extrato'); setCardId('') }}
          className={`flex-1 flex items-center gap-4 cursor-pointer ${documentType === 'extrato' ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-white">Extrato bancario</p>
            <p className="text-xs text-gray-400">Transacoes de conta bancaria</p>
          </div>
        </Card>
        <Card
          hover
          onClick={() => { setDocumentType('fatura'); setAccountId('') }}
          className={`flex-1 flex items-center gap-4 cursor-pointer ${documentType === 'fatura' ? 'ring-2 ring-orange-500' : ''}`}
        >
          <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
            <FileText className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-white">Fatura de cartao</p>
            <p className="text-xs text-gray-400">Fatura do cartao de credito</p>
          </div>
        </Card>
      </div>

      {/* Account/Card selector */}
      <Card>
        {documentType === 'extrato' ? (
          <Select
            label="Conta de destino"
            placeholder="Selecione uma conta..."
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            options={accounts?.filter((a) => a.is_active).map((a) => ({ value: a.id, label: a.bank_name })) ?? []}
          />
        ) : (
          <Select
            label="Cartao de destino"
            placeholder="Selecione um cartao..."
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            options={cards?.filter((c) => c.is_active).map((c) => ({ value: c.id, label: `${c.card_name} *${c.last_digits}` })) ?? []}
          />
        )}
      </Card>

      {/* Steps */}
      <Card>
        {step === 'upload' && (
          <div className="space-y-4">
            <FileUpload type={importType} onFile={handleFileSelected} />
            {loading && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando arquivo...
              </div>
            )}
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <ColumnMapper columns={columns} mapping={mapping} onChange={setMapping} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={reset}>Voltar</Button>
              <Button
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => setStep('preview')}
              >
                Ver preview
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <ImportPreview rows={preview} duplicateCount={duplicateCount} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep(importType === 'csv' ? 'mapping' : 'upload')}>
                Voltar
              </Button>
              <Button
                icon={loading ? undefined : <Check className="w-4 h-4" />}
                loading={loading}
                onClick={handleConfirm}
              >
                Confirmar importacao ({preview.filter((r) => !r.isDuplicate).length} transacoes)
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Importacao concluida!</h3>
            <p className="text-sm text-gray-500 mb-6">
              {preview.filter((r) => !r.isDuplicate).length} transacoes foram importadas.
            </p>
            <Button onClick={reset} icon={<Upload className="w-4 h-4" />}>
              Importar mais
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
