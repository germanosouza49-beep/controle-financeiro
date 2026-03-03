import { useState, useRef, useEffect, FormEvent } from 'react'
import { Send, Bot, Sparkles, Loader2, Heart } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ChatBubble } from '@/components/ai/ChatBubble'
import { InsightCard } from '@/components/ai/InsightCard'
import { useChatHistory, useSendChat, useAISuggestions, useAIAnomalies, useHealthScore } from '@/hooks/useAI'

const quickPrompts = [
  'Quanto gastei este mes?',
  'Quais sao minhas maiores despesas?',
  'Como posso economizar?',
  'Resuma minhas financas deste mes',
]

export default function AIChat() {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: history, isLoading: historyLoading } = useChatHistory()
  const sendChat = useSendChat()

  const { data: suggestions } = useAISuggestions()
  const { data: anomalies } = useAIAnomalies()
  const { data: healthScore } = useHealthScore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!message.trim() || sendChat.isPending) return
    sendChat.mutate(message.trim())
    setMessage('')
    inputRef.current?.focus()
  }

  function handleQuickPrompt(prompt: string) {
    sendChat.mutate(prompt)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Header
        title="Assistente IA"
        subtitle="Pergunte sobre suas financas em linguagem natural"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat area */}
        <div className="lg:col-span-2">
          <Card padding={false} className="flex flex-col h-[calc(100vh-220px)]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!history?.length && !historyLoading && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 dark:bg-purple-900/30 rounded-full mb-4">
                    <Bot className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                    Ola! Sou seu assistente financeiro
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                    Pergunte qualquer coisa sobre suas financas. Posso analisar gastos, sugerir economias e mais.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleQuickPrompt(prompt)}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-400 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {history?.map((msg) => (
                <ChatBubble key={msg.id} role={msg.role} content={msg.content} timestamp={msg.created_at} />
              ))}

              {sendChat.isPending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="bg-gray-100 dark:bg-dark-card rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analisando...
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 dark:border-dark-border p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Pergunte sobre suas financas..."
                  className="input-field flex-1"
                  disabled={sendChat.isPending}
                />
                <Button
                  type="submit"
                  disabled={!message.trim() || sendChat.isPending}
                  icon={<Send className="w-4 h-4" />}
                >
                  Enviar
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Insights sidebar */}
        <div className="space-y-4">
          {/* Health Score */}
          {healthScore && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-expense" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Saude financeira</h3>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`text-3xl font-bold ${
                  healthScore.total_score >= 80 ? 'text-income' :
                  healthScore.total_score >= 60 ? 'text-brand-500' :
                  healthScore.total_score >= 40 ? 'text-warning' : 'text-expense'
                }`}>
                  {healthScore.total_score}
                </div>
                <div className="text-sm text-gray-500">/ 100</div>
                <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                  healthScore.classification === 'excellent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  healthScore.classification === 'good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  healthScore.classification === 'attention' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {healthScore.classification === 'excellent' ? 'Excelente' :
                   healthScore.classification === 'good' ? 'Bom' :
                   healthScore.classification === 'attention' ? 'Atencao' :
                   healthScore.classification === 'critical' ? 'Critico' : 'Emergencia'}
                </span>
              </div>
              <div className="space-y-2">
                {healthScore.components.map((comp) => (
                  <div key={comp.name}>
                    <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                      <span>{comp.name}</span>
                      <span>{comp.score}/{comp.max_score}</span>
                    </div>
                    <ProgressBar value={comp.score} max={comp.max_score} />
                  </div>
                ))}
              </div>
              {healthScore.tips.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                  <p className="text-xs font-medium text-gray-500 mb-1">Dicas</p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    {healthScore.tips.slice(0, 3).map((tip, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-brand-500 flex-shrink-0">-</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Insights da IA
          </h3>

          {suggestions?.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}

          {anomalies?.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}

          {!suggestions?.length && !anomalies?.length && (
            <Card className="text-center py-8">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                Insights serao gerados quando houver transacoes suficientes.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
