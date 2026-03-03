import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Building2,
  CreditCard,
  Upload,
  PiggyBank,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Target,
  TrendingUp,
  BarChart3,
  Zap,
  Bell,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { classNames } from '@/utils/format'
import { supabase } from '@/services/supabase'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transacoes', icon: ArrowLeftRight, label: 'Transacoes' },
  { to: '/contas', icon: Building2, label: 'Contas' },
  { to: '/cartoes', icon: CreditCard, label: 'Cartoes' },
  { to: '/importar', icon: Upload, label: 'Importar' },
  { to: '/orcamentos', icon: PiggyBank, label: 'Orcamentos' },
  { to: '/metas', icon: Target, label: 'Metas' },
  { to: '/fluxo-de-caixa', icon: TrendingUp, label: 'Fluxo de caixa' },
  { to: '/analytics', icon: BarChart3, label: 'Analise comparativa' },
  { to: '/regras', icon: Zap, label: 'Regras' },
  { to: '/notificacoes', icon: Bell, label: 'Notificacoes' },
  { to: '/assistente', icon: Bot, label: 'Assistente IA' },
  { to: '/configuracoes', icon: Settings, label: 'Configuracoes' },
]

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggle = useUIStore((s) => s.toggleSidebar)
  const profile = useAuthStore((s) => s.profile)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <aside
      className={classNames(
        'fixed top-0 left-0 h-screen bg-white dark:bg-dark-card border-r border-gray-100 dark:border-dark-border flex flex-col transition-all duration-300 z-40',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-dark-border">
        <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">FC</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">
            FinControl
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const link = (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                classNames(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                )
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          )
          return collapsed ? (
            <Tooltip key={to} content={label}>
              {link}
            </Tooltip>
          ) : (
            link
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 dark:border-dark-border p-3">
        {profile && (
          <div className={classNames('flex items-center gap-3 mb-3', collapsed && 'justify-center')}>
            <Avatar name={profile.full_name} url={profile.avatar_url} size="sm" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{profile.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={handleLogout}
            className={classNames(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full',
              collapsed && 'justify-center',
            )}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  )
}
