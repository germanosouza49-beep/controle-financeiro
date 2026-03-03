import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.middleware.js'
import * as accountsService from '../services/accounts.service.js'

export async function list(req: AuthRequest, res: Response) {
  try {
    const data = await accountsService.listAccounts(req.userId!)
    res.json(data)
  } catch (err) {
    console.error('[Accounts] Erro ao listar:', (err as Error).message)
    res.status(500).json({ message: 'Erro ao carregar contas. Tente novamente.' })
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const data = await accountsService.createAccount(req.userId!, req.body)
    res.status(201).json(data)
  } catch (err) {
    console.error('[Accounts] Erro ao criar:', (err as Error).message)
    res.status(500).json({ message: 'Erro ao criar conta. Verifique os dados e tente novamente.', debug: (err as Error).message })
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const data = await accountsService.updateAccount(req.userId!, req.params.id, req.body)
    res.json(data)
  } catch (err) {
    console.error('[Accounts] Erro ao atualizar:', (err as Error).message)
    res.status(500).json({ message: 'Erro ao atualizar conta. Tente novamente.' })
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const data = await accountsService.deleteAccount(req.userId!, req.params.id)
    res.json(data)
  } catch (err) {
    console.error('[Accounts] Erro ao remover:', (err as Error).message)
    res.status(500).json({ message: 'Erro ao remover conta. Tente novamente.' })
  }
}
