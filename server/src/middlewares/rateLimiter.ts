import type { Response, NextFunction } from 'express'
import type { AuthRequest } from './auth.middleware.js'

const dailyLimit = parseInt(process.env.AI_DAILY_LIMIT || '30', 10)

// In-memory store: userId -> { count, resetDate }
const store = new Map<string, { count: number; resetDate: string }>()

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function aiRateLimiter(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.userId
  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  const today = getTodayKey()
  const entry = store.get(userId)

  if (!entry || entry.resetDate !== today) {
    store.set(userId, { count: 1, resetDate: today })
    return next()
  }

  if (entry.count >= dailyLimit) {
    return res.status(429).json({
      message: `Daily AI limit reached (${dailyLimit} calls/day). Try again tomorrow.`,
    })
  }

  entry.count++
  next()
}
