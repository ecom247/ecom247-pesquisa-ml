import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LogoOnDark } from '../components/Logo'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })

    if (err) {
      setError('E-mail ou senha incorretos. Verifique seus dados.')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-dark-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <LogoOnDark className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
          <p className="text-gray-400 text-sm mt-1">
            Plataforma exclusiva para alunos ECOM247
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="bg-dark-200 border border-dark-300 rounded-2xl p-8 space-y-5"
        >
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-dark-300 border border-dark-400 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-dark-300 border border-dark-400 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Não tem acesso?{' '}
          <span className="text-orange-400">
            Entre em contato com a ECOM247
          </span>
        </p>
      </div>
    </div>
  )
}
