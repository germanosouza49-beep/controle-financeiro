import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.middleware.js'
import * as categoriesService from '../services/categories.service.js'

export async function list(req: AuthRequest, res: Response) {
  try {
    const data = await categoriesService.listCategories(req.userId!)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to list categories', details: (err as Error).message })
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = await categoriesService.createCategory(req.userId!, req.body)
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create category', details: (err as Error).message })
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const data = await categoriesService.updateCategory(req.userId!, req.params.id, req.body)
    res.json(data)
  } catch (err) {
    const message = (err as Error).message
    const status = message.includes('Cannot modify') || message.includes('not found') ? 403 : 500
    res.status(status).json({ message, details: message })
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    await categoriesService.deleteCategory(req.userId!, req.params.id)
    res.json({ message: 'Category deleted' })
  } catch (err) {
    const message = (err as Error).message
    const status = message.includes('Cannot delete') || message.includes('not found') ? 403 : 500
    res.status(status).json({ message, details: message })
  }
}
