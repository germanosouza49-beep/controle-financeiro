import { supabaseAdmin } from '../config/supabase.js'
import { geminiFlash, geminiPro } from '../config/gemini.js'
import { buildCategorizePrompt } from '../prompts/categorize.prompt.js'
import { buildSummaryPrompt } from '../prompts/summary.prompt.js'
import { buildSuggestionsPrompt } from '../prompts/suggestions.prompt.js'
import { buildForecastPrompt } from '../prompts/forecast.prompt.js'
import { buildAnomalyPrompt } from '../prompts/anomaly.prompt.js'
import { buildChatSystemPrompt } from '../prompts/chat.prompt.js'
import { buildHealthScorePrompt } from '../prompts/health-score.prompt.js'
import { applyRules } from './rules.service.js'

// ============================================================
// Categorize
// ============================================================
export async function categorizeTransactions(userId: string, transactionIds: string[]) {
  // Fetch transactions
  const { data: transactions, error: txError } = await supabaseAdmin
    .from('fc_transactions')
    .select('id, description, amount, type')
    .eq('user_id', userId)
    .in('id', transactionIds)

  if (txError || !transactions?.length) throw new Error('Transactions not found')

  // Step 1: Apply deterministic rules first (zero AI cost)
  const results: Array<{
    transaction_id: string
    category_id: string
    confidence: number
    reasoning: string
    auto_applied: boolean
  }> = []
  const needsAI: typeof transactions = []

  for (const tx of transactions) {
    const ruleMatch = await applyRules(userId, tx.description)
    if (ruleMatch) {
      await supabaseAdmin
        .from('fc_transactions')
        .update({
          category_id: ruleMatch,
          ai_category_confidence: 1.0,
          ai_categorized: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tx.id)
        .eq('user_id', userId)

      results.push({
        transaction_id: tx.id,
        category_id: ruleMatch,
        confidence: 1.0,
        reasoning: 'Matched by categorization rule',
        auto_applied: true,
      })
    } else {
      needsAI.push(tx)
    }
  }

  // Step 2: If no transactions need AI, return early
  if (needsAI.length === 0) return results

  // Fetch categories
  const { data: categories, error: catError } = await supabaseAdmin
    .from('fc_categories')
    .select('id, name, type')
    .or(`is_system.eq.true,user_id.eq.${userId}`)

  if (catError) throw catError

  // Fetch user corrections (transactions that were ai_categorized then manually changed)
  const { data: corrections } = await supabaseAdmin
    .from('fc_transactions')
    .select('description, fc_categories(name)')
    .eq('user_id', userId)
    .eq('ai_categorized', true)
    .not('category_id', 'is', null)
    .limit(50)

  const correctionList = (corrections || []).map(c => ({
    description: c.description,
    category_name: (c.fc_categories as unknown as { name: string } | null)?.name || '',
  })).filter(c => c.category_name)

  // Step 3: Send remaining to Gemini AI
  const prompt = buildCategorizePrompt(categories || [], needsAI, correctionList)
  const result = await geminiFlash.generateContent(prompt)
  const text = result.response.text()

  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('AI returned invalid categorization response')

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    id: string
    category_id: string
    confidence: number
    reasoning: string
  }>

  // Apply AI categorizations
  for (const item of parsed) {
    const shouldAutoApply = item.confidence >= 0.85
    const { error } = await supabaseAdmin
      .from('fc_transactions')
      .update({
        category_id: shouldAutoApply ? item.category_id : null,
        ai_category_confidence: item.confidence,
        ai_categorized: shouldAutoApply,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id)
      .eq('user_id', userId)

    if (!error) {
      results.push({
        transaction_id: item.id,
        category_id: item.category_id,
        confidence: item.confidence,
        reasoning: item.reasoning,
        auto_applied: shouldAutoApply,
      })
    }
  }

  return results
}

// ============================================================
// Monthly Summary
// ============================================================
export async function generateSummary(userId: string, month: number, year: number) {
  // Check cache
  const { data: existing } = await supabaseAdmin
    .from('fc_ai_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'summary')
    .eq('reference_month', month)
    .eq('reference_year', year)
    .single()

  if (existing) return existing

  // Build context
  const currentSummary = await getMonthSummary(userId, month, year)
  const previousMonths = []
  for (let i = 1; i <= 3; i++) {
    let m = month - i
    let y = year
    if (m <= 0) { m += 12; y-- }
    const s = await getMonthSummary(userId, m, y)
    previousMonths.push({ month: m, year: y, ...s })
  }

  const prompt = buildSummaryPrompt({
    month,
    year,
    ...currentSummary,
    previous_months: previousMonths,
  })

  const result = await geminiFlash.generateContent(prompt)
  const content = result.response.text()

  const { data: insight, error } = await supabaseAdmin
    .from('fc_ai_insights')
    .insert({
      user_id: userId,
      type: 'summary',
      title: `Resumo Financeiro ${String(month).padStart(2, '0')}/${year}`,
      content,
      reference_month: month,
      reference_year: year,
    })
    .select()
    .single()

  if (error) throw error
  return insight
}

// ============================================================
// Suggestions
// ============================================================
export async function generateSuggestions(userId: string) {
  // Last 6 months of data by category
  const now = new Date()
  const months = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ month: d.getMonth() + 1, year: d.getFullYear() })
  }

  const { data: categories } = await supabaseAdmin
    .from('fc_categories')
    .select('id, name')
    .or(`is_system.eq.true,user_id.eq.${userId}`)

  const categoryMap = new Map((categories || []).map(c => [c.id, c.name]))
  const monthlyCategoryData: Record<string, Array<{ month: number; year: number; total: number }>> = {}

  for (const { month, year } of months) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endMonth = month === 12 ? 1 : month + 1
    const endYear = month === 12 ? year + 1 : year
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

    const { data: txs } = await supabaseAdmin
      .from('fc_transactions')
      .select('category_id, amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lt('date', endDate)

    for (const tx of txs || []) {
      if (!tx.category_id) continue
      const name = categoryMap.get(tx.category_id) || 'Outros'
      if (!monthlyCategoryData[name]) monthlyCategoryData[name] = []
      const existing = monthlyCategoryData[name].find(e => e.month === month && e.year === year)
      if (existing) {
        existing.total += Number(tx.amount)
      } else {
        monthlyCategoryData[name].push({ month, year, total: Number(tx.amount) })
      }
    }
  }

  // Find recurring transactions
  const { data: recurring } = await supabaseAdmin
    .from('fc_transactions')
    .select('description, amount')
    .eq('user_id', userId)
    .eq('is_recurring', true)

  const prompt = buildSuggestionsPrompt({
    monthly_by_category: Object.entries(monthlyCategoryData).map(([name, data]) => ({
      category_name: name,
      months: data,
    })),
    recurring_transactions: (recurring || []).map(r => ({
      description: r.description,
      amount: Number(r.amount),
      frequency: 'monthly',
    })),
  })

  const result = await geminiFlash.generateContent(prompt)
  const text = result.response.text()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  const suggestions = JSON.parse(jsonMatch[0])

  // Save as insight
  await supabaseAdmin.from('fc_ai_insights').insert({
    user_id: userId,
    type: 'suggestion',
    title: 'Sugestões de Economia',
    content: JSON.stringify(suggestions),
    metadata: { suggestions },
  })

  return suggestions
}

// ============================================================
// Forecast
// ============================================================
export async function generateForecast(userId: string) {
  const now = new Date()
  const historical = []

  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = d.getMonth() + 1
    const year = d.getFullYear()
    const summary = await getMonthSummary(userId, month, year)
    historical.push({ month, year, ...summary })
  }

  const { data: recurring } = await supabaseAdmin
    .from('fc_transactions')
    .select('description, amount, type')
    .eq('user_id', userId)
    .eq('is_recurring', true)

  const prompt = buildForecastPrompt({
    historical,
    recurring: (recurring || []).map(r => ({
      description: r.description,
      amount: Number(r.amount),
      type: r.type,
    })),
  })

  const result = await geminiFlash.generateContent(prompt)
  const text = result.response.text()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('AI returned invalid forecast response')

  const forecast = JSON.parse(jsonMatch[0])

  await supabaseAdmin.from('fc_ai_insights').insert({
    user_id: userId,
    type: 'forecast',
    title: 'Projeção Financeira - Próximos 3 meses',
    content: JSON.stringify(forecast),
    metadata: { forecast },
  })

  return forecast
}

// ============================================================
// Anomalies
// ============================================================
export async function detectAnomalies(userId: string) {
  const now = new Date()
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    .toISOString().slice(0, 10)
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    .toISOString().slice(0, 10)

  // Recent transactions
  const { data: recent } = await supabaseAdmin
    .from('fc_transactions')
    .select('id, description, amount, date, category_id, fc_categories(name)')
    .eq('user_id', userId)
    .gte('date', oneMonthAgo)
    .order('date', { ascending: false })

  // Category averages from last 3 months
  const { data: historical } = await supabaseAdmin
    .from('fc_transactions')
    .select('amount, category_id, fc_categories(name)')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', threeMonthsAgo)
    .lt('date', oneMonthAgo)

  // Calculate averages per category
  const categoryStats = new Map<string, { amounts: number[]; name: string }>()
  for (const tx of historical || []) {
    const catName = (tx.fc_categories as unknown as { name: string } | null)?.name || 'Outros'
    const key = tx.category_id || 'uncategorized'
    const entry = categoryStats.get(key)
    if (entry) {
      entry.amounts.push(Number(tx.amount))
    } else {
      categoryStats.set(key, { amounts: [Number(tx.amount)], name: catName })
    }
  }

  const category_averages = Array.from(categoryStats.entries()).map(([_, stats]) => {
    const avg = stats.amounts.reduce((a, b) => a + b, 0) / stats.amounts.length
    const variance = stats.amounts.reduce((sum, val) => sum + (val - avg) ** 2, 0) / stats.amounts.length
    return {
      category_name: stats.name,
      avg_amount: avg,
      std_dev: Math.sqrt(variance),
    }
  })

  const prompt = buildAnomalyPrompt({
    recent_transactions: (recent || []).map(t => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      date: t.date,
      category_name: (t.fc_categories as unknown as { name: string } | null)?.name || 'Sem categoria',
    })),
    category_averages,
  })

  const result = await geminiFlash.generateContent(prompt)
  const text = result.response.text()
  const jsonMatch = text.match(/\[[\s\S]*\]/)

  const anomalies = jsonMatch ? JSON.parse(jsonMatch[0]) : []

  if (anomalies.length > 0) {
    await supabaseAdmin.from('fc_ai_insights').insert({
      user_id: userId,
      type: 'anomaly',
      title: 'Anomalias Detectadas',
      content: JSON.stringify(anomalies),
      metadata: { anomalies },
    })
  }

  return anomalies
}

// ============================================================
// Chat
// ============================================================
export async function chat(userId: string, userMessage: string) {
  // Build financial context
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const summary = await getMonthSummary(userId, month, year)

  const { data: accounts } = await supabaseAdmin
    .from('fc_accounts')
    .select('bank_name, balance')
    .eq('user_id', userId)
    .eq('is_active', true)

  const { data: cards } = await supabaseAdmin
    .from('fc_credit_cards')
    .select('card_name, credit_limit')
    .eq('user_id', userId)
    .eq('is_active', true)

  const { data: recentTxs } = await supabaseAdmin
    .from('fc_transactions')
    .select('description, amount, date, type')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(20)

  // Get chat history
  const { data: history } = await supabaseAdmin
    .from('fc_chat_messages')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  const systemPrompt = buildChatSystemPrompt({
    ...summary,
    accounts: (accounts || []).map(a => ({ bank_name: a.bank_name, balance: Number(a.balance) })),
    cards: (cards || []).map(c => ({ card_name: c.card_name, credit_limit: Number(c.credit_limit) })),
    top_categories: summary.by_category.slice(0, 5).map(c => ({ name: c.category_name, total: c.total })),
    recent_transactions: (recentTxs || []).map(t => ({
      description: t.description,
      amount: Number(t.amount),
      date: t.date,
      type: t.type,
    })),
  })

  // Save user message
  await supabaseAdmin.from('fc_chat_messages').insert({
    user_id: userId,
    role: 'user',
    content: userMessage,
  })

  // Build conversation for Gemini
  const chatHistory = (history || []).reverse().map(m => ({
    role: m.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: m.content }],
  }))

  const chatSession = geminiPro.startChat({
    history: chatHistory,
    systemInstruction: systemPrompt,
  })

  const result = await chatSession.sendMessage(userMessage)
  const assistantMessage = result.response.text()

  // Save assistant response
  await supabaseAdmin.from('fc_chat_messages').insert({
    user_id: userId,
    role: 'assistant',
    content: assistantMessage,
  })

  return { role: 'assistant', content: assistantMessage }
}

export async function getChatHistory(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('fc_chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) throw error
  return data
}

// ============================================================
// Health Score
// ============================================================
export async function generateHealthScore(userId: string) {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const summary = await getMonthSummary(userId, month, year)

  // Calculate savings rate
  const savings_rate = summary.total_income > 0
    ? ((summary.total_income - summary.total_expense) / summary.total_income) * 100
    : 0

  // Budget adherence
  const { data: budgets } = await supabaseAdmin
    .from('fc_budgets')
    .select('category_id, limit_amount')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)

  let budgetAdherence = 100
  if (budgets && budgets.length > 0) {
    let within = 0
    for (const b of budgets) {
      const catSpend = summary.by_category.find(c => c.category_id === b.category_id)
      const spent = catSpend ? catSpend.total : 0
      if (spent <= Number(b.limit_amount)) within++
    }
    budgetAdherence = (within / budgets.length) * 100
  }

  // Debt ratio (card usage vs income)
  const { data: cards } = await supabaseAdmin
    .from('fc_credit_cards')
    .select('credit_limit')
    .eq('user_id', userId)
    .eq('is_active', true)

  const totalCreditLimit = (cards || []).reduce((s, c) => s + Number(c.credit_limit), 0)
  const debt_ratio = totalCreditLimit > 0 && summary.total_income > 0
    ? (summary.total_expense / summary.total_income) * 100
    : 0

  // Emergency fund (total balance / monthly expense)
  const { data: accounts } = await supabaseAdmin
    .from('fc_accounts')
    .select('balance')
    .eq('user_id', userId)
    .eq('is_active', true)

  const totalBalance = (accounts || []).reduce((s, a) => s + Number(a.balance), 0)
  const emergency_fund_months = summary.total_expense > 0
    ? totalBalance / summary.total_expense
    : 0

  const totalExpense = summary.total_expense || 1
  const category_breakdown = summary.by_category.map(c => ({
    name: c.category_name,
    total: c.total,
    pct: (c.total / totalExpense) * 100,
  }))

  const prompt = buildHealthScorePrompt({
    total_income: summary.total_income,
    total_expense: summary.total_expense,
    savings_rate,
    budget_adherence: budgetAdherence,
    debt_ratio,
    emergency_fund_months,
    category_breakdown,
  })

  const result = await geminiFlash.generateContent(prompt)
  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI returned invalid health score response')

  const healthScore = JSON.parse(jsonMatch[0])

  // Normalize AI response to match client-expected HealthScoreResponse
  const normalized = {
    total_score: healthScore.total_score ?? healthScore.score ?? 0,
    classification: healthScore.classification ?? 'regular',
    components: healthScore.components ?? [],
    tips: healthScore.tips ?? healthScore.recommendations ?? [],
    history: healthScore.history ?? [],
    ...healthScore,
  }
  // Ensure total_score always exists at top level
  normalized.total_score = normalized.total_score ?? normalized.score ?? 0

  // Persist as insight
  await supabaseAdmin.from('fc_ai_insights').insert({
    user_id: userId,
    type: 'health_score',
    title: `Score de Saude Financeira: ${normalized.total_score}/100`,
    content: JSON.stringify(normalized),
    reference_month: month,
    reference_year: year,
    metadata: normalized,
  })

  return normalized
}

// ============================================================
// Helper
// ============================================================
async function getMonthSummary(userId: string, month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

  const { data: transactions } = await supabaseAdmin
    .from('fc_transactions')
    .select('amount, type, category_id, fc_categories(name)')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lt('date', endDate)

  let total_income = 0
  let total_expense = 0
  const catMap = new Map<string, { category_id: string; category_name: string; total: number }>()

  for (const t of transactions || []) {
    const amt = Number(t.amount)
    if (t.type === 'income') total_income += amt
    else total_expense += amt

    if (t.category_id) {
      const name = (t.fc_categories as unknown as { name: string } | null)?.name || 'Outros'
      const entry = catMap.get(t.category_id)
      if (entry) entry.total += amt
      else catMap.set(t.category_id, { category_id: t.category_id, category_name: name, total: amt })
    }
  }

  return {
    total_income,
    total_expense,
    balance: total_income - total_expense,
    by_category: Array.from(catMap.values()).sort((a, b) => b.total - a.total),
  }
}
