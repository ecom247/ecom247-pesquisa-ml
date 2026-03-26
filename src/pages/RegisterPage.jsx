import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LogoOnDark } from '../components/Logo'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })

    if (err) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w416 h-16 bg-green-900/30 border border-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-400 text-2xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Conta criada!</h2>
          <p className="text-gray-400 text-sm mb-6">
            Verifique seu e-mail para confirmar o cadastro e depois faça login.
          </p>
          <Link
            to="/login"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            Ir para o Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <LogoOnDark className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Criar conta</h1>
          <p className="text-gray-400 text-sm mt-1">
            Cadastro exclusivo para alunos ECOM247
          </p>
        </div>

        <form
          onSubmit={handleRegister}
          className="bg-dark-200 border border-dark-300 rounded-2xl p-8 space-y-5"
        >
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Nome completo</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-dark-300 border border-dark-400 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-dark-300 border border-dark-400 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-dark-300 border border-dark-400 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Criando conta...
              </span>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-orange-400 hover:text-orange-300 transition">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}
