import { useState } from 'react'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'

const API_BASE = import.meta.env.VITE_API_URL || ''

export function useExport() {
  const [loading, setLoading] = useState(false)
  const session = useAuthStore((s) => s.session)

  async function download(format: 'pdf' | 'excel', params?: { from?: string; to?: string }) {
    if (!session?.access_token) {
      toast('error', 'Voce precisa estar logado para exportar.')
      return
    }

    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (params?.from) query.set('from', params.from)
      if (params?.to) query.set('to', params.to)

      const url = `${API_BASE}/api/export/${format}${query.toString() ? `?${query}` : ''}`
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!res.ok) throw new Error('Falha ao exportar')

      const blob = await res.blob()
      const ext = format === 'pdf' ? 'pdf' : 'csv'
      const filename = `fincontrol-relatorio.${ext}`

      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)

      toast('success', `Relatorio ${format.toUpperCase()} baixado!`)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erro ao exportar')
    } finally {
      setLoading(false)
    }
  }

  return { download, loading }
}
