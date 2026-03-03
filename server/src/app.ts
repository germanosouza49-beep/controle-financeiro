import express from 'express'
import cors from 'cors'
import { errorHandler } from './middlewares/errorHandler.js'
import accountsRoutes from './routes/accounts.routes.js'
import cardsRoutes from './routes/cards.routes.js'
import categoriesRoutes from './routes/categories.routes.js'
import transactionsRoutes from './routes/transactions.routes.js'
import budgetsRoutes from './routes/budgets.routes.js'
import importRoutes from './routes/import.routes.js'
import aiRoutes from './routes/ai.routes.js'
import rulesRoutes from './routes/rules.routes.js'
import goalsRoutes from './routes/goals.routes.js'
import notificationsRoutes from './routes/notifications.routes.js'
import cashflowRoutes from './routes/cashflow.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'
import splitsRoutes from './routes/splits.routes.js'
import exportRoutes from './routes/export.routes.js'

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '5mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Core routes (PRD)
app.use('/api/accounts', accountsRoutes)
app.use('/api/cards', cardsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/transactions', transactionsRoutes)
app.use('/api/budgets', budgetsRoutes)
app.use('/api/import', importRoutes)
app.use('/api/ai', aiRoutes)

// Extended routes
app.use('/api/rules', rulesRoutes)
app.use('/api/goals', goalsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/cashflow', cashflowRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/splits', splitsRoutes)
app.use('/api/export', exportRoutes)

// Global error handler
app.use(errorHandler as never)

export { app }
