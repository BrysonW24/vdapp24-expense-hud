import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-950">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-red-500 mb-2">Something went wrong</h2>
            <pre className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900 rounded-xl p-3 overflow-auto max-h-48">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack?.slice(0, 400)}
            </pre>
            <button
              className="mt-4 w-full py-2 rounded-xl bg-brand text-white text-sm font-medium"
              onClick={() => { this.setState({ error: null }); window.location.reload() }}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
