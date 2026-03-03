import Papa from 'papaparse'
import { supabaseAdmin } from '../config/supabase.js'
import { generateImportHash, findDuplicateHashes } from './transactions.service.js'
import { geminiFlash } from '../config/gemini.js'

interface ParsedTransaction {
  date: string
  amount: number
  description: string
  type: 'income' | 'expense'
}

export async function parseCsv(buffer: Buffer): Promise<ParsedTransaction[]> {
  const text = buffer.toString('utf-8')
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  return result.data.map(row => {
    const keys = Object.keys(row)
    // Auto-detect columns by common names
    const dateKey = keys.find(k => /data|date|dt/i.test(k)) || keys[0]
    const amountKey = keys.find(k => /valor|amount|value|vlr/i.test(k)) || keys[1]
    const descKey = keys.find(k => /descri|desc|description|hist|memo/i.test(k)) || keys[2]

    const rawAmount = parseFloat(
      (row[amountKey] || '0').replace(/[^\d,.-]/g, '').replace(',', '.'),
    )

    return {
      date: normalizeDate(row[dateKey] || ''),
      amount: Math.abs(rawAmount),
      description: (row[descKey] || '').trim(),
      type: (rawAmount < 0 ? 'expense' : 'income') as 'income' | 'expense',
    }
  }).filter(t => t.description && t.amount > 0)
}

function normalizeDate(raw: string): string {
  // Handle dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd
  const parts = raw.split(/[/\-.]/)
  if (parts.length !== 3) return raw

  if (parts[0].length === 4) {
    // yyyy-mm-dd
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
  }
  // dd/mm/yyyy
  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
}

export async function previewCsvImport(userId: string, transactions: ParsedTransaction[]) {
  const hashes = transactions.map(t => generateImportHash(t.date, t.amount, t.description))
  const existingHashes = await findDuplicateHashes(userId, hashes)

  return transactions.map((t, i) => ({
    ...t,
    import_hash: hashes[i],
    is_duplicate: existingHashes.has(hashes[i]),
  }))
}

export async function confirmCsvImport(
  userId: string,
  accountId: string | null | undefined,
  cardId: string | null | undefined,
  transactions: ParsedTransaction[],
) {
  const rows = transactions.map(t => ({
    user_id: userId,
    account_id: accountId || null,
    card_id: cardId || null,
    amount: t.amount,
    type: t.type,
    description: t.description,
    date: t.date,
    import_source: 'csv' as const,
    import_hash: generateImportHash(t.date, t.amount, t.description),
  }))

  const { data, error } = await supabaseAdmin
    .from('fc_transactions')
    .insert(rows)
    .select()

  if (error) throw error
  return data
}

export async function extractPdfTransactions(fileBuffer: Buffer, _fileName: string): Promise<ParsedTransaction[]> {
  // Use Gemini multimodal to extract transactions from PDF
  const base64 = fileBuffer.toString('base64')

  const result = await geminiFlash.generateContent([
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64,
      },
    },
    {
      text: `Extraia todas as transações desta fatura de cartão de crédito.
Retorne APENAS um JSON array válido, sem markdown, no formato:
[{"date": "YYYY-MM-DD", "description": "...", "amount": 123.45, "installment_current": 1, "installment_total": 3}]
- amount deve ser sempre positivo
- Se não houver parcelas, installment_current e installment_total devem ser null
- A data deve estar no formato YYYY-MM-DD
- Inclua todas as transações listadas na fatura`,
    },
  ])

  const text = result.response.text()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Failed to extract transactions from PDF')

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    date: string
    description: string
    amount: number
    installment_current?: number | null
    installment_total?: number | null
  }>

  return parsed.map(t => ({
    date: t.date,
    amount: Math.abs(t.amount),
    description: t.description,
    type: 'expense' as const,
  }))
}

export async function confirmPdfImport(
  userId: string,
  accountId: string | null | undefined,
  cardId: string | null | undefined,
  transactions: ParsedTransaction[],
) {
  const rows = transactions.map(t => ({
    user_id: userId,
    card_id: cardId || null,
    account_id: accountId || null,
    amount: t.amount,
    type: t.type,
    description: t.description,
    date: t.date,
    import_source: 'pdf' as const,
    import_hash: generateImportHash(t.date, t.amount, t.description),
  }))

  const { data, error } = await supabaseAdmin
    .from('fc_transactions')
    .insert(rows)
    .select()

  if (error) throw error
  return data
}
