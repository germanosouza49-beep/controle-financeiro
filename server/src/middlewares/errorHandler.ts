import type { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error('[Error]', err.message, err.stack)

  const statusCode = (err as Error & { statusCode?: number }).statusCode || 500
  const message = statusCode === 500 ? 'Internal server error' : err.message

  res.status(statusCode).json({
    message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
}
