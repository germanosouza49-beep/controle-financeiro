import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.middleware.js'
import * as importService from '../services/import.service.js'
import { categorizeTransactions } from '../services/ai.service.js'
import Papa from 'papaparse'

export async function csvUpload(req: AuthRequest, res: Response) {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Extract column names from the CSV header
    const text = file.buffer.toString('utf-8')
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      preview: 1,
    })
    const columns = parsed.meta.fields || []

    const transactions = await importService.parseCsv(file.buffer)
    const previewData = await importService.previewCsvImport(req.userId!, transactions)

    // Map to client-expected format
    const preview = previewData.map(t => ({
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
      isDuplicate: t.is_duplicate,
    }))

    const duplicates = preview.filter(t => t.isDuplicate).length

    res.json({ columns, preview, duplicates })
  } catch (err) {
    res.status(500).json({ message: 'Failed to parse CSV', details: (err as Error).message })
  }
}

export async function csvConfirm(req: AuthRequest, res: Response) {
  try {
    const { account_id, card_id, transactions } = req.body
    const saved = await importService.confirmCsvImport(req.userId!, account_id, card_id, transactions)

    // Trigger AI categorization in background
    const ids = (saved || []).map((t: { id: string }) => t.id)
    if (ids.length > 0) {
      categorizeTransactions(req.userId!, ids).catch(err => {
        console.error('[AI Categorization Error]', err)
      })
    }

    res.status(201).json({ imported: saved?.length || 0, transactions: saved })
  } catch (err) {
    res.status(500).json({ message: 'Failed to confirm CSV import', details: (err as Error).message })
  }
}

export async function pdfUpload(req: AuthRequest, res: Response) {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const transactions = await importService.extractPdfTransactions(file.buffer, file.originalname)
    const previewData = await importService.previewCsvImport(req.userId!, transactions)

    // Map to client-expected format
    const preview = previewData.map(t => ({
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
      isDuplicate: t.is_duplicate,
    }))

    const duplicates = preview.filter(t => t.isDuplicate).length

    res.json({ preview, duplicates })
  } catch (err) {
    res.status(500).json({ message: 'Failed to process PDF', details: (err as Error).message })
  }
}

export async function pdfConfirm(req: AuthRequest, res: Response) {
  try {
    const { card_id, transactions } = req.body
    const saved = await importService.confirmPdfImport(req.userId!, card_id, transactions)

    // Trigger AI categorization in background
    const ids = (saved || []).map((t: { id: string }) => t.id)
    if (ids.length > 0) {
      categorizeTransactions(req.userId!, ids).catch(err => {
        console.error('[AI Categorization Error]', err)
      })
    }

    res.status(201).json({ imported: saved?.length || 0, transactions: saved })
  } catch (err) {
    res.status(500).json({ message: 'Failed to confirm PDF import', details: (err as Error).message })
  }
}
