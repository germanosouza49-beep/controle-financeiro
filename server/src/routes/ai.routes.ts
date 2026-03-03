import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { aiRateLimiter } from '../middlewares/rateLimiter.js'
import { validate } from '../middlewares/validate.js'
import { categorizeSchema, summaryQuerySchema, chatSchema } from '../validators/ai.validator.js'
import * as controller from '../controllers/ai.controller.js'

const router = Router()

router.use(authMiddleware as never)
router.use(aiRateLimiter as never)

router.post('/categorize', validate(categorizeSchema) as never, controller.categorize as never)
router.get('/summary', validate(summaryQuerySchema, 'query') as never, controller.summary as never)
router.get('/suggestions', controller.suggestions as never)
router.get('/forecast', controller.forecast as never)
router.get('/anomalies', controller.anomalies as never)
router.get('/health-score', controller.healthScore as never)
router.post('/chat', validate(chatSchema) as never, controller.chat as never)
router.get('/chat/history', controller.chatHistory as never)

export default router
