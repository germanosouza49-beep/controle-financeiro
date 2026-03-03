import type { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase.js'

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: 'Missing authorization token' })
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }

  req.userId = user.id
  next()
}
