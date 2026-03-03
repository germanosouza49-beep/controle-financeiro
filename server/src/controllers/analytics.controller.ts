import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.middleware.js'
import * as analyticsService from '../services/analytics.service.js'

export async function compare(req: AuthRequest, res: Response) {
  try {
    const { period1_from, period1_to, period2_from, period2_to } = req.query as Record<string, string>
    const data = await analyticsService.comparePeriods(
      req.userId!,
      period1_from,
      period1_to,
      period2_from,
      period2_to,
    )
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to compare periods', details: (err as Error).message })
  }
}
