import { z } from 'zod'

export const compareQuerySchema = z.object({
  period1_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period1_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period2_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period2_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
