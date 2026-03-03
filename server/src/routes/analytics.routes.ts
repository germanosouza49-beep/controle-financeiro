import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import { compareQuerySchema } from '../validators/analytics.validator.js'
import * as controller from '../controllers/analytics.controller.js'

const router = Router()

router.use(authMiddleware as never)

router.get('/compare', validate(compareQuerySchema, 'query') as never, controller.compare as never)

export default router
