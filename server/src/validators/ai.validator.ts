import { z } from 'zod'

export const categorizeSchema = z.object({
  transaction_ids: z.array(z.string().uuid()).min(1).max(50),
})

export const summaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
})

export const chatSchema = z.object({
  message: z.string().min(1).max(2000),
})
