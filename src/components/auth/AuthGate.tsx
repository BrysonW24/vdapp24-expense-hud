import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { SplashBackground } from './SplashBackground'
import { Wallet, ArrowRight, Shield, Cloud, Zap } from 'lucide-react'

type View = 'splash' | 'login' | 'signup'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()
  const [view, setView] = useState<View>('splash')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [skipAuth, setSkipAuth] = useState(false)

  // Allow offline usage
  if (skipAuth) return <>{children}</>

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) return <>{children}</>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (view === 'login') {
      const { error: authError } = await signInWithEmail(email, password)
      setSubmitting(false)
      if (authError) setError(authError.message)
    } else {
      const { error: authError } = await signUpWithEmail(email, password)
      setSubmitting(false)
      if (authError) {
        setError(authError.message)
      } else {
        setSuccessMsg('Check your email for a confirmation link, then sign in.')
        setView('login')
      }
    }
  }

  // ── Splash view ──────────────────────────────────────────────
  if (view === 'splash') {
    return (
      <div className="min-h-screen bg-charcoal text-white overflow-hidden relative">
        <SplashBackground />

        {/* Content overlay */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Top nav */}
          <header className="flex items-center justify-between px-6 py-5 lg:px-12">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
                <Wallet size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg">Expense HUD</span>
            </div>
            <button
              onClick={() => setView('login')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign In
            </button>
          </header>

          {/* Hero */}
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-lg text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-medium mb-6">
                <Zap size={12} />
                Personal Finance OS
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                Your money,
                <br />
                <span className="text-brand">visualised.</span>
              </h1>

              <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-md mx-auto leading-relaxed">
                Import bank statements, track spending, forecast your future, and see your finances come alive with 22 interactive visualizations.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-8"
                  onClick={() => setView('signup')}
                >
                  Get Started Free
                  <ArrowRight size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto px-8 text-gray-300 hover:text-white hover:bg-white/10"
                  onClick={() => setSkipAuth(true)}
                >
                  Try Offline
                </Button>
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5">
                  <Shield size={11} className="text-green-400" />
                  Bank-grade encryption
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5">
                  <Cloud size={11} className="text-blue-400" />
                  Cloud sync across devices
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5">
                  <Zap size={11} className="text-brand" />
                  Instant local-first UX
                </span>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="text-center pb-6 text-[11px] text-gray-600">
            Built by Vivacity Digital
          </div>
        </div>
      </div>
    )
  }

  // ── Auth form (login / signup) ───────────────────────────────
  return (
    <div className="min-h-screen bg-charcoal text-white overflow-hidden relative">
      <SplashBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top nav */}
        <header className="flex items-center justify-between px-6 py-5 lg:px-12">
          <button
            onClick={() => setView('splash')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
              <Wallet size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg">Expense HUD</span>
          </button>
        </header>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">
                {view === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {view === 'login' ? 'Sign in to your Expense HUD' : 'Start tracking your finances'}
              </p>
            </div>

            <div className="bg-charcoal-light/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Password</label>
                  <input
                    type="password"
                    placeholder={view === 'signup' ? 'Min 6 characters' : '••••••••'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
                )}

                {successMsg && (
                  <p className="text-xs text-green-400 bg-green-900/20 rounded-lg px-3 py-2">{successMsg}</p>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? 'Please wait...' : view === 'login' ? 'Sign In' : 'Create Account'}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-gray-500">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Google OAuth */}
              <button
                onClick={() => signInWithGoogle()}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </div>

            {/* Toggle + Skip */}
            <div className="mt-5 text-center space-y-2">
              <button
                onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(''); setSuccessMsg('') }}
                className="text-sm text-brand hover:underline"
              >
                {view === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
              <div>
                <button
                  onClick={() => setSkipAuth(true)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Continue offline (data stays on this device)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
