import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import { createSplitSchema } from '../validators/splits.validator.js'
import * as controller from '../controllers/splits.controller.js'

const router = Router()

router.use(authMiddleware as never)

router.get('/balance', controller.balance as never)
router.post('/:id/split', validate(createSplitSchema) as never, controller.create as never)

export default router
