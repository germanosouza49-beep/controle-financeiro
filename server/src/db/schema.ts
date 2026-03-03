import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  date,
  jsonb,
  unique,
  check,
  index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ===========================================
// PROFILES (extends Supabase auth.users)
// ===========================================
export const profiles = pgTable('fc_profiles', {
  id: uuid('id').primaryKey(),
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('admin'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ===========================================
// ACCOUNTS
// ===========================================
export const accounts = pgTable(
  'fc_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    bankName: text('bank_name').notNull(),
    accountType: text('account_type').notNull().default('checking'),
    balance: decimal('balance', { precision: 12, scale: 2 }).notNull().default('0'),
    color: text('color').default('#3B82F6'),
    icon: text('icon').default('building-2'),
    scope: text('scope').default('personal'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      'account_type_check',
      sql`${table.accountType} IN ('checking', 'savings', 'investment')`,
    ),
    check(
      'account_scope_check',
      sql`${table.scope} IN ('personal', 'business')`,
    ),
  ],
)

// ===========================================
// CREDIT CARDS
// ===========================================
export const creditCards = pgTable(
  'fc_credit_cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    cardName: text('card_name').notNull(),
    lastDigits: text('last_digits').notNull(),
    creditLimit: decimal('credit_limit', { precision: 12, scale: 2 }).notNull(),
    closingDay: integer('closing_day').notNull(),
    dueDay: integer('due_day').notNull(),
    color: text('color').default('#8B5CF6'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check('last_digits_length', sql`length(${table.lastDigits}) = 4`),
    check('closing_day_range', sql`${table.closingDay} BETWEEN 1 AND 31`),
    check('due_day_range', sql`${table.dueDay} BETWEEN 1 AND 31`),
  ],
)

// ===========================================
// CATEGORIES
// ===========================================
export const categories = pgTable(
  'fc_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    icon: text('icon').notNull(),
    color: text('color').notNull(),
    type: text('type').notNull(),
    isSystem: boolean('is_system').default(false),
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check('category_type_check', sql`${table.type} IN ('income', 'expense')`),
  ],
)

// ===========================================
// TRANSACTIONS
// ===========================================
export const transactions = pgTable(
  'fc_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id').references(() => accounts.id, {
      onDelete: 'set null',
    }),
    cardId: uuid('card_id').references(() => creditCards.id, {
      onDelete: 'set null',
    }),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    type: text('type').notNull(),
    description: text('description').notNull(),
    date: date('date').notNull(),
    isRecurring: boolean('is_recurring').default(false),
    recurrenceRule: text('recurrence_rule'),
    installmentCurrent: integer('installment_current'),
    installmentTotal: integer('installment_total'),
    aiCategoryConfidence: decimal('ai_category_confidence', {
      precision: 3,
      scale: 2,
    }),
    aiCategorized: boolean('ai_categorized').default(false),
    importSource: text('import_source'),
    importHash: text('import_hash'),
    scope: text('scope').default('personal'),
    notes: text('notes'),
    tags: text('tags').array(),
    isPlanned: boolean('is_planned').default(false),
    plannedDate: date('planned_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      'transaction_type_check',
      sql`${table.type} IN ('income', 'expense')`,
    ),
    check(
      'account_or_card_required',
      sql`${table.accountId} IS NOT NULL OR ${table.cardId} IS NOT NULL`,
    ),
    check(
      'transaction_scope_check',
      sql`${table.scope} IN ('personal', 'business', 'shared')`,
    ),
    index('idx_transactions_user_date').on(table.userId, table.date),
    index('idx_transactions_import_hash').on(table.importHash),
    index('idx_transactions_category').on(table.categoryId),
    index('idx_transactions_scope').on(table.userId, table.scope),
  ],
)

// ===========================================
// BUDGETS
// ===========================================
export const budgets = pgTable(
  'fc_budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    limitAmount: decimal('limit_amount', { precision: 12, scale: 2 }).notNull(),
    alertThreshold: decimal('alert_threshold', { precision: 3, scale: 2 }).default('0.80'),
  },
  (table) => [
    unique('budgets_user_category_month_year').on(
      table.userId,
      table.categoryId,
      table.month,
      table.year,
    ),
    check('budget_month_range', sql`${table.month} BETWEEN 1 AND 12`),
  ],
)

// ===========================================
// AI INSIGHTS
// ===========================================
export const aiInsights = pgTable(
  'fc_ai_insights',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    referenceMonth: integer('reference_month'),
    referenceYear: integer('reference_year'),
    metadata: jsonb('metadata'),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      'insight_type_check',
      sql`${table.type} IN ('summary', 'suggestion', 'anomaly', 'forecast', 'health_score')`,
    ),
  ],
)

// ===========================================
// CHAT MESSAGES
// ===========================================
export const chatMessages = pgTable(
  'fc_chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check('chat_role_check', sql`${table.role} IN ('user', 'assistant')`),
  ],
)

// ===========================================
// CATEGORIZATION RULES
// Deterministic regex-based categorization that runs BEFORE AI
// ===========================================
export const categorizationRules = pgTable(
  'fc_categorization_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' }),
    pattern: text('pattern').notNull(),
    matchType: text('match_type').notNull().default('contains'),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    priority: integer('priority').default(0),
    isActive: boolean('is_active').default(true),
    isSystem: boolean('is_system').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      'match_type_check',
      sql`${table.matchType} IN ('contains', 'starts_with', 'ends_with', 'regex', 'exact')`,
    ),
    index('idx_rules_user').on(table.userId),
  ],
)

// ===========================================
// NOTIFICATIONS
// ===========================================
export const notifications = pgTable(
  'fc_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    metadata: jsonb('metadata'),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      'notification_type_check',
      sql`${table.type} IN ('budget_alert', 'card_limit', 'due_date', 'anomaly', 'system')`,
    ),
    index('idx_notifications_user_read').on(table.userId, table.isRead),
  ],
)

// ===========================================
// RECURRING TEMPLATES
// ===========================================
export const recurringTemplates = pgTable(
  'fc_recurring_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id').references(() => accounts.id, {
      onDelete: 'set null',
    }),
    cardId: uuid('card_id').references(() => creditCards.id, {
      onDelete: 'set null',
    }),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    type: text('type').notNull(),
    description: text('description').notNull(),
    frequency: text('frequency').notNull(),
    dayOfMonth: integer('day_of_month'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    lastGenerated: date('last_generated'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      'template_type_check',
      sql`${table.type} IN ('income', 'expense')`,
    ),
    check(
      'template_frequency_check',
      sql`${table.frequency} IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')`,
    ),
    index('idx_templates_user').on(table.userId),
  ],
)

// ===========================================
// SAVINGS GOALS
// ===========================================
export const savingsGoals = pgTable(
  'fc_savings_goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    targetAmount: decimal('target_amount', { precision: 12, scale: 2 }).notNull(),
    currentAmount: decimal('current_amount', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    deadline: date('deadline'),
    icon: text('icon').default('target'),
    color: text('color').default('#10B981'),
    autoPercentage: decimal('auto_percentage', { precision: 5, scale: 2 }),
    isCompleted: boolean('is_completed').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_goals_user').on(table.userId),
  ],
)

// ===========================================
// SAVINGS CONTRIBUTIONS
// ===========================================
export const savingsContributions = pgTable(
  'fc_savings_contributions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    goalId: uuid('goal_id')
      .notNull()
      .references(() => savingsGoals.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    source: text('source').default('manual'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      'contribution_source_check',
      sql`${table.source} IN ('manual', 'auto', 'transfer')`,
    ),
  ],
)

// ===========================================
// TRANSACTION SPLITS (expense sharing between members)
// ===========================================
export const transactionSplits = pgTable(
  'fc_transaction_splits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => profiles.id),
    percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    isSettled: boolean('is_settled').default(false),
    settledAt: timestamp('settled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_splits_transaction').on(table.transactionId),
    index('idx_splits_member').on(table.memberId),
  ],
)
