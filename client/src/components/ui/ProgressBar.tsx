import { classNames } from '@/utils/format'

interface ProgressBarProps {
  value: number
  max: number
  className?: string
  showLabel?: boolean
  colorByPercent?: boolean
}

function getColor(percent: number): string {
  if (percent >= 100) return 'bg-red-500'
  if (percent >= 80) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export function ProgressBar({ value, max, className, showLabel, colorByPercent = true }: ProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color = colorByPercent ? getColor(percent) : 'bg-brand-500'

  return (
    <div className={classNames('space-y-1', className)}>
      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={classNames('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {percent.toFixed(0)}%
        </p>
      )}
    </div>
  )
}
