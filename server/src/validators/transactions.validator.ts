import { z } from 'zod'

export const createTransactionSchema = z.object({
  account_id: z.string().uuid().nullable().optional(),
  card_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  amount: z.number().positive(),
  type: z.enum(['income', 'expense']),
  description: z.string().min(1).max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_recurring: z.boolean().default(false),
  recurrence_rule: z.string().nullable().optional(),
  installment_current: z.number().int().positive().nullable().optional(),
  installment_total: z.number().int().positive().nullable().optional(),
}).refine(
  (data) => data.account_id || data.card_id,
  { message: 'Either account_id or card_id must be provided' },
)

export const updateTransactionSchema = z.object({
  account_id: z.string().uuid().nullable().optional(),
  card_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  amount: z.number().positive().optional(),
  type: z.enum(['income', 'expense']).optional(),
  description: z.string().min(1).max(500).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  is_recurring: z.boolean().optional(),
  recurrence_rule: z.string().nullable().optional(),
  installment_current: z.number().int().positive().nullable().optional(),
  installment_total: z.number().int().positive().nullable().optional(),
})

export const transactionFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().uuid().optional(),
  type: z.enum(['income', 'expense']).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  account_id: z.string().uuid().optional(),
  card_id: z.string().uuid().optional(),
  search: z.string().optional(),
})

export const summaryQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  account_id: z.string().uuid().optional(),
  card_id: z.string().uuid().optional(),
})
