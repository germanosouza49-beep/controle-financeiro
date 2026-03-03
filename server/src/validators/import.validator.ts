import { z } from 'zod'

export const csvConfirmSchema = z.object({
  account_id: z.string().uuid().nullable().optional(),
  card_id: z.string().uuid().nullable().optional(),
  transactions: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    amount: z.number(),
    description: z.string().min(1),
    type: z.enum(['income', 'expense']),
  })).min(1).max(500),
}).refine(
  (data) => data.account_id || data.card_id,
  { message: 'Selecione uma conta ou cartao de destino' },
)

export const pdfConfirmSchema = z.object({
  account_id: z.string().uuid().nullable().optional(),
  card_id: z.string().uuid().nullable().optional(),
  transactions: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    amount: z.number().positive(),
    description: z.string().min(1),
    type: z.enum(['income', 'expense']),
    installment_current: z.number().int().positive().nullable().optional(),
    installment_total: z.number().int().positive().nullable().optional(),
  })).min(1),
}).refine(
  (data) => data.account_id || data.card_id,
  { message: 'Selecione uma conta ou cartao de destino' },
)
