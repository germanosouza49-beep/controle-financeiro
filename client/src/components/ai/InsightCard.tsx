import { Lightbulb, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { AIInsight } from '@shared/types/api.types'

const iconMap: Record<string, { icon: typeof Lightbulb; color: string; bg: string }> = {
  summary: { icon: BarChart3, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/30' },
  suggestion: { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  anomaly: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30' },
  forecast: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
}

interface InsightCardProps {
  insight: AIInsight
}

export function InsightCard({ insight }: InsightCardProps) {
  const config = iconMap[insight.type] || iconMap.summary
  const Icon = config.icon

  return (
    <Card hover className="group">
      <div className="flex gap-4">
        <div className={`${config.bg} p-3 rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">{insight.title}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">{insight.content}</p>
        </div>
      </div>
    </Card>
  )
}
