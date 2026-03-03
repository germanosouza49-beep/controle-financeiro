import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.middleware.js'
import * as exportService from '../services/export.service.js'

export async function exportPdf(req: AuthRequest, res: Response) {
  try {
    // For PDF export, we return the data as JSON (PDF generation can be done client-side)
    const filters = req.query as { from: string; to: string; account_id?: string; card_id?: string }
    const data = await exportService.exportJson(req.userId!, filters)
    res.json({ format: 'pdf_data', transactions: data })
  } catch (err) {
    res.status(500).json({ message: 'Failed to export PDF data', details: (err as Error).message })
  }
}

export async function exportExcel(req: AuthRequest, res: Response) {
  try {
    // Export as CSV (compatible with Excel)
    const filters = req.query as { from: string; to: string; account_id?: string; card_id?: string }
    const csv = await exportService.exportCsv(req.userId!, filters)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=fincontrol_${filters.from}_${filters.to}.csv`)
    res.send(csv)
  } catch (err) {
    res.status(500).json({ message: 'Failed to export Excel', details: (err as Error).message })
  }
}
