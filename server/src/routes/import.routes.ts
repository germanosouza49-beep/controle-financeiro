import { Router } from 'express'
import multer from 'multer'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.js'
import { csvConfirmSchema, pdfConfirmSchema } from '../validators/import.validator.js'
import * as controller from '../controllers/import.controller.js'

const maxSize = parseInt(process.env.UPLOAD_MAX_SIZE_MB || '10', 10) * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSize },
})

const router = Router()

router.use(authMiddleware as never)

router.post('/csv', upload.single('file') as never, controller.csvUpload as never)
router.post('/csv/confirm', validate(csvConfirmSchema) as never, controller.csvConfirm as never)
router.post('/pdf', upload.single('file') as never, controller.pdfUpload as never)
router.post('/pdf/confirm', validate(pdfConfirmSchema) as never, controller.pdfConfirm as never)

export default router
