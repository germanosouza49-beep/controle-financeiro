import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import { createGoalSchema, updateGoalSchema, contributeSchema } from '../validators/goals.validator.js'
import * as controller from '../controllers/goals.controller.js'

const router = Router()

router.use(authMiddleware as never)

router.get('/', controller.list as never)
router.post('/', validate(createGoalSchema) as never, controller.create as never)
router.put('/:id', validate(updateGoalSchema) as never, controller.update as never)
router.delete('/:id', controller.remove as never)
router.post('/:id/contribute', validate(contributeSchema) as never, controller.contribute as never)

export default router
