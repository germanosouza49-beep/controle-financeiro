import { z } from 'zod'

export const exportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().default(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  ),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().default(
    new Date().toISOString().slice(0, 10),
  ),
  account_id: z.string().uuid().optional(),
  card_id: z.string().uuid().optional(),
})
