import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.middleware.js'
import * as splitsService from '../services/splits.service.js'

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = await splitsService.createSplit(req.userId!, req.params.id, req.body.splits)
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create split', details: (err as Error).message })
  }
}

export async function balance(req: AuthRequest, res: Response) {
  try {
    const data = await splitsService.getSplitBalance(req.userId!)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get split balance', details: (err as Error).message })
  }
}
