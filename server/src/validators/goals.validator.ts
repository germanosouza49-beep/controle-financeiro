import { z } from 'zod'

export const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  target_amount: z.number().positive(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  icon: z.string().default('target'),
  color: z.string().default('#10B981'),
  auto_percentage: z.number().min(0).max(100).nullable().optional(),
})

export const updateGoalSchema = createGoalSchema.partial()

export const contributeSchema = z.object({
  amount: z.number().positive(),
  source: z.enum(['manual', 'auto', 'transfer']).default('manual'),
})
