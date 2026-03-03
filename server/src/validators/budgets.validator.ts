import { z } from 'zod'

export const createBudgetSchema = z.object({
  category_id: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  limit_amount: z.number().positive(),
  alert_threshold: z.number().min(0).max(1).default(0.80),
})

export const updateBudgetSchema = z.object({
  category_id: z.string().uuid().optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  limit_amount: z.number().positive().optional(),
  alert_threshold: z.number().min(0).max(1).optional(),
})
