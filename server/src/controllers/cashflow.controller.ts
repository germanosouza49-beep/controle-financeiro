import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.middleware.js'
import * as cashflowService from '../services/cashflow.service.js'

export async function project(req: AuthRequest, res: Response) {
  try {
    const days = parseInt(req.query.days as string, 10) || 30
    const data = await cashflowService.projectCashflow(req.userId!, days)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to project cashflow', details: (err as Error).message })
  }
}
