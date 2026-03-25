import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    login(email)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="bg-[#111111] p-8 rounded-xl w-full max-w-md">
        <h1 className="text-white text-2xl font-bold mb-6">Entrar</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 bg-[#1A1A1A] text-white rounded-lg" />
          <input type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 bg-[#1A1A1A] text-white rounded-lg" />
          <button type="submit" className="w-full p-3 bg-[#FF6803] text-white rounded-lg font-bold">Entrar</button>
        </form>
        <p className="text-gray-400 mt-4 text-center">Novo? <Link to="/register" className="text-[#FF6803]">Criar conta</Link></p>
      </div>
    </div>
  )
}