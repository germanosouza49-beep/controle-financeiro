import { Bell, CheckCheck, AlertTriangle, CreditCard, Calendar, TrendingUp, Info } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications'
import { formatDate } from '@/utils/format'
import type { NotificationType } from '@shared/types/api.types'

const iconByType: Record<NotificationType, React.ReactNode> = {
  budget_alert: <AlertTriangle className="w-5 h-5 text-warning" />,
  card_limit: <CreditCard className="w-5 h-5 text-expense" />,
  due_date: <Calendar className="w-5 h-5 text-brand-500" />,
  anomaly: <TrendingUp className="w-5 h-5 text-purple-500" />,
  system: <Info className="w-5 h-5 text-gray-500" />,
}

const badgeByType: Record<NotificationType, { label: string; variant: 'warning' | 'danger' | 'info' | 'default' | 'success' }> = {
  budget_alert: { label: 'Orcamento', variant: 'warning' },
  card_limit: { label: 'Cartao', variant: 'danger' },
  due_date: { label: 'Vencimento', variant: 'info' },
  anomaly: { label: 'Anomalia', variant: 'warning' },
  system: { label: 'Sistema', variant: 'default' },
}

export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications()
  const markReadMutation = useMarkAsRead()
  const markAllMutation = useMarkAllAsRead()

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0

  return (
    <div className="space-y-6 animate-fade-in">
      <Header
        title="Notificacoes"
        subtitle={unreadCount > 0 ? `${unreadCount} nao lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              icon={<CheckCheck className="w-4 h-4" />}
              onClick={() => markAllMutation.mutate()}
              loading={markAllMutation.isPending}
            >
              Marcar todas como lidas
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !notifications?.length ? (
        <EmptyState
          icon={<Bell className="w-16 h-16" />}
          title="Nenhuma notificacao"
          description="Quando houver alertas de orcamento, vencimentos ou anomalias, eles aparecerao aqui."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`transition-colors cursor-pointer ${!notif.is_read ? 'border-l-4 border-l-brand-500 bg-brand-50/30 dark:bg-brand-900/10' : ''}`}
              onClick={() => {
                if (!notif.is_read) markReadMutation.mutate(notif.id)
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-bg flex items-center justify-center flex-shrink-0">
                  {iconByType[notif.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-semibold ${!notif.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {notif.title}
                    </p>
                    <Badge variant={badgeByType[notif.type].variant}>
                      {badgeByType[notif.type].label}
                    </Badge>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(notif.created_at)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
