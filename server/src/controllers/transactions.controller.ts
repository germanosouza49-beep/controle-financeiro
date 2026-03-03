import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.middleware.js'
import * as transactionsService from '../services/transactions.service.js'

export async function list(req: AuthRequest, res: Response) {
  try {
    const result = await transactionsService.listTransactions(req.userId!, req.query as never)
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: 'Failed to list transactions', details: (err as Error).message })
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = await transactionsService.createTransaction(req.userId!, req.body)
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create transaction', details: (err as Error).message })
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const data = await transactionsService.updateTransaction(req.userId!, req.params.id, req.body)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update transaction', details: (err as Error).message })
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    await transactionsService.deleteTransaction(req.userId!, req.params.id)
    res.json({ message: 'Transaction deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete transaction', details: (err as Error).message })
  }
}

export async function summary(req: AuthRequest, res: Response) {
  try {
    const { from, to, account_id, card_id } = req.query as {
      from: string
      to: string
      account_id?: string
      card_id?: string
    }
    const data = await transactionsService.getTransactionSummary(
      req.userId!,
      from,
      to,
      account_id,
      card_id,
    )
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get summary', details: (err as Error).message })
  }
}
