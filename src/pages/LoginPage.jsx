import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email) return
    login(email)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="bg-dark-100 border border-dark-300 p-8 rounded-2xl w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-white text-2xl font-bold mb-2">Bem-vindo de volta</h1>
          <p className="text-gray-400 text-sm">Entre na sua conta ECOM247</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full p-3 bg-dark-200 border border-dark-400 text-white rounded-xl focus:border-orange focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full p-3 bg-dark-200 border border-dark-400 text-white rounded-xl focus:border-orange focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full p-3 bg-orange hover:bg-orange-500 text-white rounded-xl font-bold transition-colors mt-2"
          >
            Entrar
          </button>
        </form>
        <p className="text-gray-400 mt-6 text-center text-sm">
          Nao tem conta?{' '}
          <Link to="/register" className="text-orange hover:underline font-medium">
            Criar conta gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
