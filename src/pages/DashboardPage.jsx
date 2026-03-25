import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, BarChart2, TrendingUp, Users, DollarSign, Calendar,
  GitCompare, Bell, History, LogOut, ChevronRight, Menu, X,
  Sparkles, AlertCircle, FileText, Target, Zap
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
import {
  mockCompetitors, mockDemandData, mockPriceDistribution,
  mockCategoryMetrics, mockScoreData, mockSearchHistory,
  mockSeasonalityData, mockMarketShareData, mockComplaints,
  mockActionPlan, mockAlerts
} from '../data/mockData'

const navSections = [
  { id: 'search', label: 'Nova Pesquisa', icon: Search, group: 'main' },
  { id: 'score', label: 'Score', icon: Target, group: 'results', requiresSearch: true },
  { id: 'competitors', label: 'Concorrentes', icon: Users, group: 'results', requiresSearch: true },
  { id: 'demand', label: 'Demanda', icon: TrendingUp, group: 'results', requiresSearch: true },
  { id: 'seasonality', label: 'Sazonalidade', icon: Calendar, group: 'results', requiresSearch: true },
  { id: 'pricing', label: 'Calculadora', icon: DollarSign, group: 'results', requiresSearch: true },
  { id: 'actionplan', label: 'Plano de Acao IA', icon: Zap, group: 'results', requiresSearch: true },
  { id: 'comparison', label: 'Comparacao', icon: GitCompare, group: 'tools' },
  { id: 'alerts', label: 'Alertas', icon: Bell, group: 'tools', badge: 1 },
  { id: 'history', label: 'Historico', icon: History, group: 'tools' },
]

function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {[1, 2, 3].map((i) => (
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
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('search')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchDone, setSearchDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSearchDone(true)
      setActiveSection('score')
    }, 1500)
  }

  const renderContent = () => {
    if (loading) return <LoadingState />
    switch (activeSection) {
      case 'search':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">Nova Pesquisa</h2>
            <p className="text-gray-400 mb-6">Pesquise um produto para analisar o mercado no Mercado Livre</p>
            <SearchBar onSearch={handleSearch} />
          </div>
        )
      case 'score':
        return <ScoreCard data={mockScoreData} product={searchQuery} />
      case 'competitors':
        return <CompetitorTable data={mockCompetitors} />
      case 'demand':
        return <DemandChart data={mockDemandData} />
      case 'seasonality':
        return <SeasonalityChart data={mockSeasonalityData} />
      case 'pricing':
        return <PricingCalculator data={mockPriceDistribution} categoryMetrics={mockCategoryMetrics} />
      case 'actionplan':
        return <ActionPlan data={mockActionPlan} />
      case 'comparison':
        return <ComparisonPage />
      case 'alerts':
        return <AlertsPage data={mockAlerts} />
      case 'history':
        return <SearchHistory data={mockSearchHistory} onSelect={handleSearch} />
      default:
        return null
    }
  }

  const groupedNav = {
    main: navSections.filter(s => s.group === 'main'),
    results: navSections.filter(s => s.group === 'results'),
    tools: navSections.filter(s => s.group === 'tools'),
  }

  return (
    <div className="flex h-screen bg-dark text-white overflow-hidden">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-dark-100 border-r border-dark-300 flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-dark-300 flex items-center justify-between">
          <LogoOnDark />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Main */}
          <div>
            {groupedNav.main.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeSection === item.id
                      ? 'bg-orange text-white'
                      : 'text-gray-400 hover:text-white hover:bg-dark-300'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* Results */}
          {searchDone && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">Resultados</p>
              {groupedNav.results.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveSection(item.id); setSidebarOpen(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeSection === item.id
                        ? 'bg-orange text-white'
                        : 'text-gray-400 hover:text-white hover:bg-dark-300'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Tools */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">Ferramentas</p>
            {groupedNav.tools.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                    activeSection === item.id
                      ? 'bg-orange text-white'
                      : 'text-gray-400 hover:text-white hover:bg-dark-300'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto bg-orange text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-dark-300">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-dark-300 transition-all"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-dark-100 border-b border-dark-300 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-semibold text-sm text-gray-300">
              {navSections.find(s => s.id === activeSection)?.label || 'Dashboard'}
            </h1>
          </div>
          {searchDone && (
            <ExportPDF
              searchQuery={searchQuery}
              scoreData={mockScoreData}
              competitors={mockCompetitors}
              demandData={mockDemandData}
            />
          )}
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto bg-dark">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
