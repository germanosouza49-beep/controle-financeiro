import type { Response, NextFunction } from 'express'
import type { AuthRequest } from './auth.middleware.js'
import { supabaseAdmin } from '../config/supabase.js'

type Role = 'admin' | 'member' | 'viewer'

export function requireRole(...allowedRoles: Role[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const { data: profile, error } = await supabaseAdmin
      .from('fc_profiles')
      .select('role')
      .eq('id', req.userId)
      .single()

    if (error || !profile) {
      return res.status(403).json({ message: 'Profile not found' })
    }

    req.userRole = profile.role

    if (!allowedRoles.includes(profile.role as Role)) {
      return res.status(403).json({ message: 'Insufficient permissions' })
    }

    next()
  }
}
