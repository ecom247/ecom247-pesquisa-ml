import { Link } from 'react-router-dom'
import { useAuth } from '../App'

export default function Navbar() {
  const { logout } = useAuth()
  return (
    <nav className="bg-[#111111] border-b border-[#222] px-6 py-4 flex items-center justify-between">
      <Link to="/dashboard" className="text-white font-bold text-xl">ECOM247</Link>
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link>
        <button onClick={logout} className="text-gray-400 hover:text-white">Sair</button>
      </div>
    </nav>
  )
}