import { z } from 'zod'

export const createRuleSchema = z.object({
  pattern: z.string().min(1).max(200),
  match_type: z.enum(['contains', 'starts_with', 'ends_with', 'regex', 'exact']).default('contains'),
  category_id: z.string().uuid(),
  priority: z.number().int().min(0).max(100).default(0),
})

export const updateRuleSchema = createRuleSchema.partial()
