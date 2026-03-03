import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import * as controller from '../controllers/notifications.controller.js'

const router = Router()

router.use(authMiddleware as never)

router.get('/', controller.list as never)
router.put('/read-all', controller.markAllAsRead as never)
router.put('/:id/read', controller.markAsRead as never)

export default router
