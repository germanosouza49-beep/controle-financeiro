import { z } from 'zod'

export const notificationsQuerySchema = z.object({
  is_read: z.enum(['true', 'false']).optional(),
})
