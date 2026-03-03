import { ReactNode } from 'react'
import { classNames } from '@/utils/format'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, padding = true, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={classNames(
        'card',
        padding && 'p-5',
        hover && 'hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all duration-200 cursor-pointer',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}
