import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg m-4">
          <h2 className="text-red-400 font-bold mb-2">Something went wrong</h2>
          <p className="text-red-300 text-sm mb-2">{this.state.error?.message}</p>
          <button
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            className="bg-red-500 text-white px-4 py-2 rounded text-sm"
          >
            Clear data & reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
