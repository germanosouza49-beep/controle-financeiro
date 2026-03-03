import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.middleware.js'
import * as notificationsService from '../services/notifications.service.js'

export async function list(req: AuthRequest, res: Response) {
  try {
    const isRead = req.query.is_read === 'true' ? true
      : req.query.is_read === 'false' ? false
      : undefined
    const data = await notificationsService.listNotifications(req.userId!, isRead)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to list notifications', details: (err as Error).message })
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const data = await notificationsService.markAsRead(req.userId!, req.params.id)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark as read', details: (err as Error).message })
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  try {
    await notificationsService.markAllAsRead(req.userId!)
    res.json({ message: 'All notifications marked as read' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark all as read', details: (err as Error).message })
  }
}
