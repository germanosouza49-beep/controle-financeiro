import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().min(1),
  color: z.string().min(1),
  type: z.enum(['income', 'expense']),
})

export const updateCategorySchema = createCategorySchema.partial()
