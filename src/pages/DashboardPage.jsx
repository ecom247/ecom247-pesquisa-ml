import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, BarChart2, TrendingUp, Users, DollarSign, Calendar,
  GitCompare, Bell, History, LogOut, Menu, X,
  Sparkles, FileText, Target, Zap, AlertCircle
} from 'lucide-react'
import { useAuth } from '../App'
import { LogoOnDark } from '../components/Logo'
import SearchBar from '../components/SearchBar'
import ScoreCard from '../components/ScoreCard'
import CompetitorTable from '../components/CompetitorTable'
import DemandChart from '../components/DemandChart'
import PricingCalculator from '../components/PricingCalculator'
import SearchHistory from '../components/SearchHistory'
import ExportPDF from '../components/ExportPDF'
import MarketShareChart from '../components/MarketShareChart'
import SeasonalityChart from '../components/SeasonalityChart'
import ComplaintsAnalysis from '../components/ComplaintsAnalysis'
import ActionPlan from '../components/ActionPlan'
import ComparisonPage from './ComparisonPage'
import AlertsPage from './AlertsPage'
import { searchML, getHistory } from '../lib/api'
import { supabase } from '../lib/supabase'
import {
  mockSeasonality,
  mockMarketShare,
  mockComplaints,
  mockActionPlan,
  mockAlerts,
} from '../data/mockData'

const navItems = [
  { id: 'search',      label: 'Pesquisa',    icon: Search,     group: 'main' },
  { id: 'score',       label: 'Score',       icon: Target,     group: 'main' },
  { id: 'competitors', label: 'Concorrentes', icon: Users,     group: 'main' },
  { id: 'demand',      label: 'Demanda',     icon: TrendingUp, group: 'main' },
  { id: 'pricing',     label: 'Precificacao', icon: DollarSign, group: 'main' },
  { id: 'seasonality', label: 'Sazonalidade', icon: Calendar,  group: 'insights' },
  { id: 'marketshare', label: 'Market Share', icon: BarChart2, group: 'insights' },
  { id: 'complaints',  label: 'Reclamacoes', icon: AlertCircle, group: 'insights' },
  { id: 'plan',        label: 'Plano IA',    icon: Sparkles,   group: 'insights' },
  { id: 'export',      label: 'Exportar PDF', icon: FileText,  group: 'tools' },
  { id: 'comparison',  label: 'Comparacao',  icon: GitCompare, group: 'tools' },
  { id: 'alerts',      label: 'Alertas',     icon: Bell,       group: 'tools', badge: 3 },
  { id: 'history',     label: 'Historico',   icon: History,    group: 'tools' },
]

function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-dark-200 border border-dark-300 rounded-2xl p-6">
          <div className="h-4 bg-dark-400 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-3 bg-dark-400 rounded w-full" />
            <div className="h-3 bg-dark-400 rounded w-4/5" />
            <div className="h-3 bg-dark-400 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('search')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [hasResults, setHasResults] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [currentQuery, setCurrentQuery] = useState('')
  const [competitors, setCompetitors] = useState([])
  const [demandData, setDemandData] = useState([])
  const [score, setScore] = useState(0)
  const [scoreDetails, setScoreDetails] = useState({})
  const [avgPrice, setAvgPrice] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [topItem, setTopItem] = useState(null)

  const [history, setHistory] = useState([])
  const [mlConnected, setMlConnected] = useState(null)
  const [mlNotif, setMlNotif] = useState('')

  useEffect(() => {
    loadHistory()
    checkMlConnection()
    const params = new URLSearchParams(window.location.search)
    const mlAuth = params.get('ml_auth')
    const mlError = params.get('ml_error')
    if (mlAuth === 'success') { setMlNotif('success'); setMlConnected(true); window.history.replaceState({}, '', '/dashboard') }
    else if (mlError) { setMlNotif('error:' + mlError); window.history.replaceState({}, '', '/dashboard') }
  }, [])

  const loadHistory = async () => {
    try {
      const data = await getHistory()
      setHistory(data)
    } catch (e) {
      console.warn('Erro ao carregar historico:', e)
    }
  }

  const checkMlConnection = async () => {
    try {
      const { data } = await supabase.from('ml_tokens').select('id').eq('id', 1).single()
      setMlConnected(!!(data && data.id))
    } catch { setMlConnected(false) }
  }
  const handleConnectML = () => {
    const cb = encodeURIComponent('https://ecom247-pesquisa-ml.vercel.app/api/ml-oauth-callback')
    window.location.href = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=2014098063924509&redirect_uri=${cb}&state=ecom247reauth`
  }

  const handleSearch = async (query) => {
    if (!query.trim()) return
    setIsLoading(true)
    setSearchError('')
    setHasResults(false)
    setCurrentQuery(query)

    try {
      const data = await searchML(query)
      setCompetitors(data.competitors || [])
      setDemandData(data.demandData || [])
      setScore(data.score || 0)
      setScoreDetails(data.scoreDetails || {})
      setAvgPrice(data.avgPrice || 0)
      setTotalSales(data.totalSales || 0)
      setTopItem(data.topItem || null)
      setHasResults(true)
      setActiveSection('score')
      await loadHistory()
    } catch (err) {
      setSearchError(err.message || 'Erro ao buscar dados. Tente novamente.')
      setIsLoading(false)
      return
    }

    setIsLoading(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Aluno'

  const renderSection = () => {
    if (isLoading) return <LoadingState />

    if (searchError) {
      return (
        <div className="p-6">
          <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-2xl p-6 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 opacity-70" />
            <p className="font-medium">{searchError}</p>
            <button
              onClick={() => { setSearchError(''); setActiveSection('search') }}
              className="mt-4 text-sm text-orange-400 hover:text-orange-300 transition"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )
    }

    switch (activeSection) {
      case 'search':
        return (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Nova Pesquisa</h2>
              <p className="text-gray-400 text-sm">
                Digite um produto para analisar o mercado no Mercado Livre
              </p>
            </div>
            <SearchBar onSearch={handleSearch} />
            {!hasResults && (
              <div className="bg-dark-200 border border-dark-300 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={28} className="text-orange-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Pronto para pesquisar</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  Use dados reais do Mercado Livre para encontrar as melhores oportunidades de produto.
                </p>
              </div>
            )}
          </div>
        )

      case 'score':
        return hasResults ? (
          <ScoreCard score={score} details={scoreDetails} query={currentQuery} topItem={topItem} avgPrice={avgPrice} totalSales={totalSales} />
        ) : (
          <EmptyState onSearch={() => setActiveSection('search')} />
        )

      case 'competitors':
        return hasResults ? (
          <CompetitorTable data={competitors} />
        ) : (
          <EmptyState onSearch={() => setActiveSection('search')} />
        )

      case 'demand':
        return hasResults ? (
          <DemandChart data={demandData} />
        ) : (
          <EmptyState onSearch={() => setActiveSection('search')} />
        )

      case 'pricing':
        return hasResults ? (
          <PricingCalculator avgPrice={avgPrice} />
        ) : (
          <EmptyState onSearch={() => setActiveSection('search')} />
        )

      case 'seasonality':
        return <SeasonalityChart data={mockSeasonality} />

      case 'marketshare':
        return <MarketShareChart data={mockMarketShare} />

      case 'complaints':
        return <ComplaintsAnalysis data={mockComplaints} />

      case 'plan':
        return <ActionPlan data={mockActionPlan} query={currentQuery} score={score} />

      case 'export':
        return (
          <ExportPDF query={currentQuery} score={score} competitors={competitors} demandData={demandData} />
        )

      case 'comparison':
        return <ComparisonPage />

      case 'alerts':
        return <AlertsPage data={mockAlerts} />

      case 'history':
        return (
          <SearchHistory
            data={history}
            onSelect={(item) => { handleSearch(item.query) }}
          />
        )

      default:
        return null
    }
  }

  const groups = [
    { label: 'Principal', ids: ['search', 'score', 'competitors', 'demand', 'pricing'] },
    { label: 'Insights', ids: ['seasonality', 'marketshare', 'complaints', 'plan'] },
    { label: 'Ferramentas', ids: ['export', 'comparison', 'alerts', 'history'] },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-dark-300">
        <LogoOnDark className="h-8" />
      </div>
      <div className="px-4 py-3 border-b border-dark-300">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
            <span className="text-orange-400 text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-2 border-b border-dark-300">
        {mlNotif === 'success' && <div className="mb-2 text-xs text-green-400 bg-green-900/30 border border-green-800 rounded-lg px-3 py-1.5">✓ ML conectado!</div>}
        {mlNotif && mlNotif.startsWith('error:') && <div className="mb-2 text-xs text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-1.5">Erro: {mlNotif.replace('error:','')}</div>}
        <button onClick={handleConnectML} disabled={mlConnected === true}
          className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition ${mlConnected ? 'bg-green-900/30 border border-green-800 text-green-400 cursor-default' : 'bg-yellow-500/10 border border-yellow-600/40 text-yellow-400 hover:bg-yellow-500/20'}`}>
          <span>{mlConnected ? '✓' : '🔗'}</span>
          {mlConnected ? 'ML Conectado' : mlConnected === null ? 'Verificando...' : 'Conectar ML'}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 space-y-4">
        {groups.map(group => (
          <div key={group.label} className="px-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-2 mb-1">
              {group.label}
            </p>
            {navItems
              .filter(item => group.ids.includes(item.id))
              .map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id); setSidebarOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors mb-0.5 text-gray-400 hover:bg-dark-200 hover:text-white"
                >
                  <item.icon size={16} className="flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="text-xs bg-orange-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-dark-300">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-dark-200 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-dark-100 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-60 bg-dark-200 border-r border-dark-300 flex-shrink-0">
        <SidebarContent />
      </aside>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-dark-200 border-r border-dark-300 flex flex-col z-10">
            <SidebarContent />
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-dark-300 bg-dark-200 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl text-gray-400 hover:bg-dark-300 transition">
            <Menu size={20} />
          </button>
          <LogoOnDark className="h-7" />
        </header>
        <main className="flex-1 overflow-y-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  )
}

function EmptyState({ onSearch }) {
  return (
    <div className="p-6 flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="w-14 h-14 bg-dark-200 border border-dark-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Zap size={24} className="text-orange-400" />
        </div>
        <h3 className="text-white font-semibold mb-2">Sem dados ainda</h3>
        <p className="text-gray-500 text-sm mb-4">Faca uma pesquisa para ver os resultados aqui.</p>
        <button
          onClick={onSearch}
          className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
        >
          Pesquisar produto
        </button>
      </div>
    </div>
  )
}
