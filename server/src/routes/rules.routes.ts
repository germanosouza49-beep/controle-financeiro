import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import { createRuleSchema, updateRuleSchema } from '../validators/rules.validator.js'
import * as controller from '../controllers/rules.controller.js'

const router = Router()

router.use(authMiddleware as never)

router.get('/', controller.list as never)
router.post('/', validate(createRuleSchema) as never, controller.create as never)
router.put('/:id', validate(updateRuleSchema) as never, controller.update as never)
router.delete('/:id', controller.remove as never)

export default router
