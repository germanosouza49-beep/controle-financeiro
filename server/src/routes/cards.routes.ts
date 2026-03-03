import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import { createCardSchema, updateCardSchema } from '../validators/cards.validator.js'
import * as controller from '../controllers/cards.controller.js'

const router = Router()

router.use(authMiddleware as never)

router.get('/', controller.list as never)
router.post('/', validate(createCardSchema) as never, controller.create as never)
router.put('/:id', validate(updateCardSchema) as never, controller.update as never)
router.delete('/:id', controller.remove as never)

export default router
