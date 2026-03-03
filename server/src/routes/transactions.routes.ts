import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFiltersSchema,
  summaryQuerySchema,
} from '../validators/transactions.validator.js'
import * as controller from '../controllers/transactions.controller.js'

const router = Router()

router.use(authMiddleware as never)

router.get('/', validate(transactionFiltersSchema, 'query') as never, controller.list as never)
router.post('/', validate(createTransactionSchema) as never, controller.create as never)
router.put('/:id', validate(updateTransactionSchema) as never, controller.update as never)
router.delete('/:id', controller.remove as never)
router.get('/summary', validate(summaryQuerySchema, 'query') as never, controller.summary as never)

export default router
