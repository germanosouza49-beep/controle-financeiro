import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import { cashflowQuerySchema } from '../validators/cashflow.validator.js'
import * as controller from '../controllers/cashflow.controller.js'

const router = Router()

router.use(authMiddleware as never)

router.get('/', validate(cashflowQuerySchema, 'query') as never, controller.project as never)

export default router
