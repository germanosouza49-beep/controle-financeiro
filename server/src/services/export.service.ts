import { supabaseAdmin } from '../config/supabase.js'

interface ExportFilters {
  from: string
  to: string
  account_id?: string
  card_id?: string
}

async function getExportData(userId: string, filters: ExportFilters) {
  let query = supabaseAdmin
    .from('fc_transactions')
    .select('date, description, amount, type, fc_categories(name), fc_accounts(bank_name), fc_credit_cards(card_name)')
    .eq('user_id', userId)
    .gte('date', filters.from)
    .lte('date', filters.to)
    .order('date', { ascending: true })

  if (filters.account_id) query = query.eq('account_id', filters.account_id)
  if (filters.card_id) query = query.eq('card_id', filters.card_id)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function exportCsv(userId: string, filters: ExportFilters): Promise<string> {
  const data = await getExportData(userId, filters)

  const header = 'Data,Descricao,Valor,Tipo,Categoria,Conta/Cartao'
  const rows = data.map(t => {
    const cat = (t.fc_categories as unknown as { name: string } | null)?.name || ''
    const account = (t.fc_accounts as unknown as { bank_name: string } | null)?.bank_name || ''
    const card = (t.fc_credit_cards as unknown as { card_name: string } | null)?.card_name || ''
    const source = account || card

    return [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      t.type === 'income' ? 'Receita' : 'Despesa',
      cat,
      source,
    ].join(',')
  })

  return [header, ...rows].join('\n')
}

export async function exportJson(userId: string, filters: ExportFilters) {
  const data = await getExportData(userId, filters)

  return data.map(t => ({
    date: t.date,
    description: t.description,
    amount: Number(t.amount),
    type: t.type,
    category: (t.fc_categories as unknown as { name: string } | null)?.name || null,
    account: (t.fc_accounts as unknown as { bank_name: string } | null)?.bank_name || null,
    card: (t.fc_credit_cards as unknown as { card_name: string } | null)?.card_name || null,
  }))
}
