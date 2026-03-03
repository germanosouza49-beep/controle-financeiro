import { z } from 'zod'

export const createAccountSchema = z.object({
  bank_name: z.string().min(1).max(100),
  account_type: z.enum(['checking', 'savings', 'investment']).default('checking'),
  balance: z.number().default(0),
  color: z.string().default('#3B82F6'),
  icon: z.string().default('building-2'),
  scope: z.enum(['personal', 'business']).default('personal'),
})

export const updateAccountSchema = createAccountSchema.partial()
