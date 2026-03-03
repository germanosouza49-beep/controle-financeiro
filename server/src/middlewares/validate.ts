import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation error',
        details: result.error.flatten().fieldErrors,
      })
    }
    req[source] = result.data
    next()
  }
}
