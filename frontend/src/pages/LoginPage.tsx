import React, { useState } from 'react'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { authService } from '../services/authService'

export const LoginPage: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return

    setLoading(true)
    setError('')

    try {
      await authService.login(username, password)
      onLoginSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Não foi possível conectar ao servidor de autenticação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <Mail className="h-5 w-5 text-brand" strokeWidth={1.5} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">
            Acesso Restrito
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Painel de Gerenciamento do Resend
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-line bg-surface p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <p className="text-[13px] text-danger">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="username" className="mb-1.5 block text-[13px] font-medium text-ink-muted">
                Usuário ou E-mail
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-ink-faint" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-primary w-full pl-9"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-ink-muted">
                Senha
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-ink-faint" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-primary w-full pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-9 w-full items-center justify-center rounded-lg bg-brand text-[13px] font-semibold text-canvas transition-colors hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
