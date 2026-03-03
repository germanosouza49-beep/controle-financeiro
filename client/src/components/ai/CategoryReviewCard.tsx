import { Check, X, Bot } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/format'

interface CategoryReviewCardProps {
  description: string
  amount: number
  suggestedCategory: string
  confidence: number
  reasoning?: string
  onAccept: () => void
  onReject: () => void
}

export function CategoryReviewCard({
  description,
  amount,
  suggestedCategory,
  confidence,
  reasoning,
  onAccept,
  onReject,
}: CategoryReviewCardProps) {
  const confidencePercent = (confidence * 100).toFixed(0)

  return (
    <Card className="border-l-4 border-l-brand-500">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
          <Bot className="w-5 h-5 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{description}</p>
            <span className="text-sm font-semibold text-red-500 ml-2">{formatCurrency(amount)}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info">{suggestedCategory}</Badge>
            <span className="text-xs text-gray-400">Confianca: {confidencePercent}%</span>
          </div>
          {reasoning && (
            <p className="text-xs text-gray-400 mb-3">{reasoning}</p>
          )}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" icon={<Check className="w-3.5 h-3.5" />} onClick={onAccept}>
              Aceitar
            </Button>
            <Button variant="ghost" size="sm" icon={<X className="w-3.5 h-3.5" />} onClick={onReject}>
              Corrigir
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
