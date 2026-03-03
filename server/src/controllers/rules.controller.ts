import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.middleware.js'
import * as rulesService from '../services/rules.service.js'

export async function list(req: AuthRequest, res: Response) {
  try {
    const data = await rulesService.listRules(req.userId!)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to list rules', details: (err as Error).message })
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = await rulesService.createRule(req.userId!, req.body)
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create rule', details: (err as Error).message })
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const data = await rulesService.updateRule(req.userId!, req.params.id, req.body)
    res.json(data)
  } catch (err) {
    const message = (err as Error).message
    const status = message.includes('Cannot modify') || message.includes('not found') ? 403 : 500
    res.status(status).json({ message, details: message })
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    await rulesService.deleteRule(req.userId!, req.params.id)
    res.json({ message: 'Rule deleted' })
  } catch (err) {
    const message = (err as Error).message
    const status = message.includes('Cannot delete') || message.includes('not found') ? 403 : 500
    res.status(status).json({ message, details: message })
  }
}
