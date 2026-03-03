import { z } from 'zod'

export const createCardSchema = z.object({
  card_name: z.string().min(1).max(100),
  last_digits: z.string().length(4).regex(/^\d{4}$/),
  credit_limit: z.number().positive(),
  closing_day: z.number().int().min(1).max(31),
  due_day: z.number().int().min(1).max(31),
  color: z.string().default('#8B5CF6'),
})

export const updateCardSchema = createCardSchema.partial()
