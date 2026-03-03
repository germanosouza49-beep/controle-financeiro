import { useState, FormEvent } from 'react'
import { Save, Moon, Sun, User, Shield, Bell } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { supabase } from '@/services/supabase'
import { toast } from '@/components/ui/Toast'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

export default function Settings() {
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)
  const darkMode = useUIStore((s) => s.darkMode)
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode)

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [loading, setLoading] = useState(false)

  const [notifSettings, setNotifSettings] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('fincontrol_notifications')
      if (stored) return JSON.parse(stored)
    } catch { /* ignore */ }
    return { card_limit: true, due_date: true, budget_alert: true, anomaly: true }
  })

  function toggleNotif(key: string) {
    setNotifSettings(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem('fincontrol_notifications', JSON.stringify(next))
      return next
    })
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
        .select()
        .single()
      if (error) throw error
      setProfile(data)
      toast('success', 'Perfil atualizado!')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const roleBadge: Record<string, { variant: 'info' | 'success' | 'default'; label: string }> = {
    admin: { variant: 'info', label: 'Administrador' },
    member: { variant: 'success', label: 'Membro' },
    viewer: { variant: 'default', label: 'Visualizador' },
  }

  const role = profile?.role ? roleBadge[profile.role] : roleBadge.admin

  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Configuracoes" subtitle="Gerencie seu perfil e preferencias" />

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
            <User className="w-4 h-4" />
            Perfil
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <Avatar name={profile?.full_name || 'U'} url={profile?.avatar_url} size="lg" />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{profile?.full_name}</p>
                <Badge variant={role.variant}>{role.label}</Badge>
              </div>
            </div>
            <Input
              label="Nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} icon={<Save className="w-4 h-4" />}>
              Salvar perfil
            </Button>
          </form>
        </Card>

        {/* Appearance */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
            {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            Aparencia
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Modo escuro</p>
              <p className="text-xs text-gray-400">Alterne entre os temas claro e escuro</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                darkMode ? 'bg-brand-600' : 'bg-gray-200'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  darkMode ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Security */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4" />
            Seguranca
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            A autenticacao e gerenciada pelo Supabase Auth. Para alterar sua senha, utilize a opcao de redefinicao de senha no login.
          </p>
        </Card>

        {/* Notifications */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4" />
            Notificacoes
          </h3>
          <div className="space-y-3">
            {[
              { key: 'card_limit', label: 'Alerta de limite do cartao', desc: 'Quando o uso atingir 80% do limite' },
              { key: 'due_date', label: 'Lembrete de vencimento', desc: 'Dias antes do vencimento da fatura' },
              { key: 'budget_alert', label: 'Alerta de orcamento', desc: 'Quando atingir o threshold definido' },
              { key: 'anomaly', label: 'Anomalias detectadas', desc: 'Gastos fora do padrao identificados pela IA' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotif(item.key)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                    notifSettings[item.key] ? 'bg-brand-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    notifSettings[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
