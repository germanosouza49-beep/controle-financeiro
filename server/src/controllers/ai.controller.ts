import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.middleware.js'
import * as aiService from '../services/ai.service.js'

export async function categorize(req: AuthRequest, res: Response) {
  try {
    const { transaction_ids } = req.body
    const results = await aiService.categorizeTransactions(req.userId!, transaction_ids)
    res.json(results)
  } catch (err) {
    res.status(500).json({ message: 'Failed to categorize', details: (err as Error).message })
  }
}

export async function summary(req: AuthRequest, res: Response) {
  try {
    const { month, year } = req.query as { month: string; year: string }
    const data = await aiService.generateSummary(
      req.userId!,
      parseInt(month, 10),
      parseInt(year, 10),
    )
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate summary', details: (err as Error).message })
  }
}

export async function suggestions(req: AuthRequest, res: Response) {
  try {
    const data = await aiService.generateSuggestions(req.userId!)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate suggestions', details: (err as Error).message })
  }
}

export async function forecast(req: AuthRequest, res: Response) {
  try {
    const data = await aiService.generateForecast(req.userId!)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate forecast', details: (err as Error).message })
  }
}

export async function anomalies(req: AuthRequest, res: Response) {
  try {
    const data = await aiService.detectAnomalies(req.userId!)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to detect anomalies', details: (err as Error).message })
  }
}

export async function chat(req: AuthRequest, res: Response) {
  try {
    const { message } = req.body
    const data = await aiService.chat(req.userId!, message)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to process chat', details: (err as Error).message })
  }
}

export async function healthScore(req: AuthRequest, res: Response) {
  try {
    const data = await aiService.generateHealthScore(req.userId!)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate health score', details: (err as Error).message })
  }
}

export async function chatHistory(req: AuthRequest, res: Response) {
  try {
    const data = await aiService.getChatHistory(req.userId!)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get chat history', details: (err as Error).message })
  }
}
