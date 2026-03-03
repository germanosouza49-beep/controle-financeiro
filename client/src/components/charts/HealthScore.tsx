import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Heart, Lightbulb } from 'lucide-react'
import { classNames } from '@/utils/format'
import type { HealthScoreResponse } from '@shared/types/api.types'

function useHealthScore() {
  return useQuery({
    queryKey: ['health-score'],
    queryFn: () => apiFetch<HealthScoreResponse>('/api/ai/health-score'),
    staleTime: 1000 * 60 * 10,
  })
}

const classificationLabels: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Bom',
  attention: 'Atencao',
  critical: 'Critico',
  emergency: 'Emergencia',
}

function getScoreColor(score: number): { stroke: string; text: string; bg: string } {
  if (score >= 70) return { stroke: '#10B981', text: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30' }
  if (score >= 40) return { stroke: '#F59E0B', text: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30' }
  return { stroke: '#EF4444', text: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/30' }
}

function CircularScore({ score, size = 120 }: { score: number; size?: number }) {
  const colors = getScoreColor(score)
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100 dark:text-gray-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={classNames('text-3xl font-bold', colors.text)}>{score}</span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">pontos</span>
      </div>
    </div>
  )
}

function ComponentBar({ name, score, maxScore }: { name: string; score: number; maxScore: number }) {
  const percent = maxScore > 0 ? (score / maxScore) * 100 : 0
  const colors = getScoreColor((score / maxScore) * 100)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">{name}</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">{score}/{maxScore}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: colors.stroke }}
        />
      </div>
    </div>
  )
}

export function HealthScore() {
  const { data, isLoading, isError } = useHealthScore()

  if (isLoading) {
    return (
      <Card>
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex justify-center">
            <Skeleton className="w-28 h-28 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Saude financeira</h3>
        </div>
        <p className="text-sm text-gray-400 text-center py-4">
          Nao foi possivel carregar o score. Adicione transacoes para gerar sua analise.
        </p>
      </Card>
    )
  }

  const colors = getScoreColor(data.total_score)

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <div className={classNames('p-1.5 rounded-lg', colors.bg)}>
          <Heart className={classNames('w-4 h-4', colors.text)} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Saude financeira</h3>
          <span className={classNames('text-xs font-medium', colors.text)}>
            {classificationLabels[data.classification] || data.classification}
          </span>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <CircularScore score={data.total_score} />
      </div>

      {data.components.length > 0 && (
        <div className="space-y-2.5 mb-4">
          {data.components.map((c) => (
            <ComponentBar key={c.name} name={c.description || c.name} score={c.score} maxScore={c.max_score} />
          ))}
        </div>
      )}

      {data.tips.length > 0 && (
        <div className="border-t border-gray-100 dark:border-dark-border pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-gray-500">Dicas da IA</span>
          </div>
          <ul className="space-y-1.5">
            {data.tips.slice(0, 3).map((tip, i) => (
              <li key={i} className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed flex gap-2">
                <span className="text-brand-500 font-bold mt-0.5">-</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
