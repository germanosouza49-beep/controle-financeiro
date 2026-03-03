import { z } from 'zod'

export const createSplitSchema = z.object({
  splits: z.array(z.object({
    member_id: z.string().uuid(),
    percentage: z.number().min(0).max(100),
  })).min(1),
})
