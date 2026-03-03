import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import { createAccountSchema, updateAccountSchema } from '../validators/accounts.validator.js'
import * as controller from '../controllers/accounts.controller.js'

const router = Router()

router.use(authMiddleware as never)

router.get('/', controller.list as never)
router.post('/', validate(createAccountSchema) as never, controller.create as never)
router.put('/:id', validate(updateAccountSchema) as never, controller.update as never)
router.delete('/:id', controller.remove as never)

export default router
