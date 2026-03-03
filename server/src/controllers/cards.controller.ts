import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.middleware.js'
import * as cardsService from '../services/cards.service.js'

export async function list(req: AuthRequest, res: Response) {
  try {
    const data = await cardsService.listCards(req.userId!)
    res.json(data)
  } catch (err) {
    console.error('[Cards] Erro ao listar:', (err as Error).message)
    res.status(500).json({ message: 'Erro ao carregar cartoes. Tente novamente.' })
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = await cardsService.createCard(req.userId!, req.body)
    res.status(201).json(data)
  } catch (err) {
    console.error('[Cards] Erro ao criar:', (err as Error).message)
    res.status(500).json({ message: 'Erro ao criar cartao. Verifique os dados e tente novamente.' })
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const data = await cardsService.updateCard(req.userId!, req.params.id, req.body)
    res.json(data)
  } catch (err) {
    console.error('[Cards] Erro ao atualizar:', (err as Error).message)
    res.status(500).json({ message: 'Erro ao atualizar cartao. Tente novamente.' })
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const data = await cardsService.deleteCard(req.userId!, req.params.id)
    res.json(data)
  } catch (err) {
    console.error('[Cards] Erro ao remover:', (err as Error).message)
    res.status(500).json({ message: 'Erro ao remover cartao. Tente novamente.' })
  }
}
