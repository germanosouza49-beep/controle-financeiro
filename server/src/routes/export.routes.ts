import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import { exportQuerySchema } from '../validators/export.validator.js'
import * as controller from '../controllers/export.controller.js'

const router = Router()

router.use(authMiddleware as never)

router.get('/pdf', validate(exportQuerySchema, 'query') as never, controller.exportPdf as never)
router.get('/excel', validate(exportQuerySchema, 'query') as never, controller.exportExcel as never)

export default router
