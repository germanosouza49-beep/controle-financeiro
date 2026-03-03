import { Bot, User } from 'lucide-react'
import { classNames } from '@/utils/format'

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export function ChatBubble({ role, content, timestamp }: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={classNames('flex gap-3 animate-fade-in', isUser && 'flex-row-reverse')}>
      <div
        className={classNames(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-brand-100 dark:bg-brand-900' : 'bg-purple-100 dark:bg-purple-900/30',
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-brand-600" />
        ) : (
          <Bot className="w-4 h-4 text-purple-600" />
        )}
      </div>
      <div
        className={classNames(
          'max-w-[75%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-brand-600 text-white rounded-tr-md'
            : 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-200 rounded-tl-md',
        )}
      >
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{content}</div>
        {timestamp && (
          <p className={classNames('text-[10px] mt-1', isUser ? 'text-blue-200' : 'text-gray-400')}>
            {new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}
