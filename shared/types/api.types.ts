// Shared types between client and server

// ====== Enums / Unions ======

export type UserRole = 'admin' | 'member' | 'viewer'
export type AccountType = 'checking' | 'savings' | 'investment'
export type TransactionType = 'income' | 'expense'
export type CategoryType = 'income' | 'expense'
export type ImportSource = 'manual' | 'csv' | 'pdf'
export type InsightType = 'summary' | 'suggestion' | 'anomaly' | 'forecast' | 'health_score'
export type ChatRole = 'user' | 'assistant'
export type NotificationType = 'budget_alert' | 'card_limit' | 'due_date' | 'anomaly' | 'system'
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
export type Scope = 'personal' | 'business' | 'shared'
export type AccountScope = 'personal' | 'business'
export type MatchType = 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'exact'
export type ContributionSource = 'manual' | 'auto' | 'transfer'

// ====== Entities ======

export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  user_id: string
  bank_name: string
  account_type: AccountType
  balance: number
  color: string
  icon: string
  scope: AccountScope
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreditCard {
  id: string
  user_id: string
  card_name: string
  last_digits: string
  credit_limit: number
  closing_day: number
  due_day: number
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: CategoryType
  is_system: boolean
  user_id: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string | null
  card_id: string | null
  category_id: string | null
  amount: number
  type: TransactionType
  description: string
  date: string
  is_recurring: boolean
  recurrence_rule: string | null
  installment_current: number | null
  installment_total: number | null
  ai_category_confidence: number | null
  ai_categorized: boolean
  import_source: ImportSource | null
  import_hash: string | null
  scope: Scope
  notes: string | null
  tags: string[] | null
  is_planned: boolean
  planned_date: string | null
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  month: number
  year: number
  limit_amount: number
  alert_threshold: number
}

export interface AIInsight {
  id: string
  user_id: string
  type: InsightType
  title: string
  content: string
  reference_month: number | null
  reference_year: number | null
  metadata: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: ChatRole
  content: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface CategorizationRule {
  id: string
  user_id: string
  pattern: string
  match_type: MatchType
  category_id: string
  priority: number
  is_active: boolean
  is_system: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  metadata: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export interface RecurringTemplate {
  id: string
  user_id: string
  account_id: string | null
  card_id: string | null
  category_id: string | null
  amount: number
  type: TransactionType
  description: string
  frequency: RecurrenceFrequency
  day_of_month: number | null
  start_date: string
  end_date: string | null
  last_generated: string | null
  is_active: boolean
  created_at: string
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  icon: string
  color: string
  auto_percentage: number | null
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface SavingsContribution {
  id: string
  goal_id: string
  amount: number
  source: ContributionSource
  created_at: string
}

export interface TransactionSplit {
  id: string
  transaction_id: string
  member_id: string
  percentage: number
  amount: number
  is_settled: boolean
  settled_at: string | null
  created_at: string
}

// ====== API Request / Response Types ======

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  code?: string
  details?: Record<string, unknown>
}

export interface TransactionFilters {
  page?: number
  limit?: number
  category?: string
  type?: TransactionType
  from?: string
  to?: string
  account_id?: string
  card_id?: string
  scope?: Scope
  search?: string
}

export interface TransactionSummary {
  total_income: number
  total_expense: number
  balance: number
  by_category: CategoryTotal[]
  vs_previous_month: {
    income_change_pct: number
    expense_change_pct: number
  }
}

export interface CategoryTotal {
  category_id: string
  category_name: string
  category_icon: string
  category_color: string
  total: number
  percentage: number
}

export interface MonthlyTrend {
  month: number
  year: number
  income: number
  expense: number
}

export interface DashboardData {
  summary: TransactionSummary
  trends: MonthlyTrend[]
  recent_transactions: Transaction[]
  accounts: Account[]
  cards: CreditCard[]
  budget_status: BudgetStatus[]
  unread_notifications: number
}

export interface BudgetStatus {
  budget: Budget
  category_name: string
  category_icon: string
  category_color: string
  spent: number
  percentage: number
  remaining: number
}

// ====== Cashflow Types ======

export interface CashflowDay {
  date: string
  projected_balance: number
  income: number
  expense: number
  events: CashflowEvent[]
}

export interface CashflowEvent {
  description: string
  amount: number
  type: 'income' | 'expense'
  source: 'recurring' | 'installment' | 'card_due' | 'planned'
}

export interface CashflowResponse {
  days: CashflowDay[]
  starting_balance: number
  ending_balance: number
  lowest_balance: number
  lowest_balance_date: string
}

// ====== Health Score Types ======

export interface HealthScoreComponent {
  name: string
  score: number
  max_score: number
  description: string
}

export interface HealthScoreResponse {
  total_score: number
  classification: 'excellent' | 'good' | 'attention' | 'critical' | 'emergency'
  components: HealthScoreComponent[]
  tips: string[]
  history: { month: number; year: number; score: number }[]
}

// ====== Import Types ======

export interface CSVPreviewRow {
  raw: Record<string, string>
  mapped: {
    date: string
    amount: number
    description: string
    type: TransactionType
  }
  is_duplicate: boolean
  import_hash: string
}

export interface CSVColumnMapping {
  date: string
  amount: string
  description: string
  type?: string
}

export interface ImportPreview {
  rows: CSVPreviewRow[]
  total: number
  duplicates: number
  new_count: number
}

export interface PDFExtractedTransaction {
  date: string
  description: string
  amount: number
  installment_current?: number
  installment_total?: number
}

// ====== AI Types ======

export interface AICategorizationResult {
  description: string
  category_id: string
  confidence: number
  reasoning: string
}

export interface AICategorizationRequest {
  transaction_ids: string[]
}

export interface AISummaryResponse {
  insight: AIInsight
  cached: boolean
}

export interface AIForecastMonth {
  month: number
  year: number
  optimistic: number
  realistic: number
  pessimistic: number
}

export interface AIForecastResponse {
  months: AIForecastMonth[]
  narrative: string
}

export interface AISuggestion {
  title: string
  description: string
  estimated_savings: number
  category_name: string
}

export interface AIChatRequest {
  message: string
}

export interface AIChatResponse {
  reply: string
  metadata?: {
    queries_used?: string[]
    data_referenced?: string[]
  }
}

// ====== Compare Types ======

export interface PeriodComparison {
  category_id: string
  category_name: string
  category_icon: string
  category_color: string
  period1_total: number
  period2_total: number
  absolute_change: number
  percentage_change: number
}

export interface CompareResponse {
  period1: { from: string; to: string; total_income: number; total_expense: number }
  period2: { from: string; to: string; total_income: number; total_expense: number }
  by_category: PeriodComparison[]
  ai_narrative?: string
}

// ====== Auth Types ======

export interface SignUpRequest {
  email: string
  password: string
  full_name: string
}

export interface SignInRequest {
  email: string
  password: string
}

export interface InviteRequest {
  email: string
  role: 'member' | 'viewer'
}

// ====== CRUD Request Types ======

export interface CreateAccountRequest {
  bank_name: string
  account_type: AccountType
  balance?: number
  color?: string
  icon?: string
  scope?: AccountScope
}

export interface UpdateAccountRequest {
  bank_name?: string
  account_type?: AccountType
  balance?: number
  color?: string
  icon?: string
  scope?: AccountScope
  is_active?: boolean
}

export interface CreateCardRequest {
  card_name: string
  last_digits: string
  credit_limit: number
  closing_day: number
  due_day: number
  color?: string
}

export interface UpdateCardRequest {
  card_name?: string
  credit_limit?: number
  closing_day?: number
  due_day?: number
  color?: string
  is_active?: boolean
}

export interface CreateTransactionRequest {
  account_id?: string
  card_id?: string
  category_id?: string
  amount: number
  type: TransactionType
  description: string
  date: string
  is_recurring?: boolean
  recurrence_rule?: string
  scope?: Scope
  notes?: string
  tags?: string[]
  is_planned?: boolean
  planned_date?: string
}

export interface UpdateTransactionRequest {
  account_id?: string
  card_id?: string
  category_id?: string
  amount?: number
  type?: TransactionType
  description?: string
  date?: string
  is_recurring?: boolean
  recurrence_rule?: string
  scope?: Scope
  notes?: string
  tags?: string[]
  is_planned?: boolean
  planned_date?: string
}

export interface CreateBudgetRequest {
  category_id: string
  month: number
  year: number
  limit_amount: number
  alert_threshold?: number
}

export interface UpdateBudgetRequest {
  limit_amount?: number
  alert_threshold?: number
}

export interface CreateRuleRequest {
  pattern: string
  match_type?: MatchType
  category_id: string
  is_exact?: boolean
  priority?: number
}

export interface UpdateRuleRequest {
  pattern?: string
  match_type?: MatchType
  category_id?: string
  priority?: number
  is_active?: boolean
}

export interface CreateGoalRequest {
  name: string
  target_amount: number
  deadline?: string
  icon?: string
  color?: string
  auto_percentage?: number
}

export interface UpdateGoalRequest {
  name?: string
  target_amount?: number
  deadline?: string | null
  icon?: string
  color?: string
  auto_percentage?: number | null
  is_completed?: boolean
}

export interface ContributeGoalRequest {
  amount: number
  source?: ContributionSource
}

export interface CreateSplitRequest {
  splits: {
    member_id: string
    percentage: number
  }[]
}
