import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.middleware.js'
import * as goalsService from '../services/goals.service.js'

export async function list(req: AuthRequest, res: Response) {
  try {
    const data = await goalsService.listGoals(req.userId!)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to list goals', details: (err as Error).message })
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = await goalsService.createGoal(req.userId!, req.body)
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create goal', details: (err as Error).message })
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const data = await goalsService.updateGoal(req.userId!, req.params.id, req.body)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update goal', details: (err as Error).message })
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    await goalsService.deleteGoal(req.userId!, req.params.id)
    res.json({ message: 'Goal deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete goal', details: (err as Error).message })
  }
}

export async function contribute(req: AuthRequest, res: Response) {
  try {
    const { amount, source } = req.body
    const data = await goalsService.contribute(req.userId!, req.params.id, amount, source)
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to contribute', details: (err as Error).message })
  }
}
