import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Algo deu errado
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
            {this.state.error?.message || 'Ocorreu um erro inesperado.'}
          </p>
          <Button
            variant="secondary"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Tentar novamente
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
