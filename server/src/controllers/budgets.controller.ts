import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.middleware.js'
import * as budgetsService from '../services/budgets.service.js'

export async function list(req: AuthRequest, res: Response) {
  try {
    const { month, year } = req.query as { month?: string; year?: string }
    const data = await budgetsService.listBudgets(
      req.userId!,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    )
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to list budgets', details: (err as Error).message })
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = await budgetsService.createBudget(req.userId!, req.body)
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create budget', details: (err as Error).message })
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const data = await budgetsService.updateBudget(req.userId!, req.params.id, req.body)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update budget', details: (err as Error).message })
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    await budgetsService.deleteBudget(req.userId!, req.params.id)
    res.json({ message: 'Budget deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete budget', details: (err as Error).message })
  }
}
