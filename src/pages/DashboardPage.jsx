import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  { id: 'actionplan', label: 'Plano de Ação IA', icon: Zap, group: 'results', requiresSearch: true },
  { id: 'comparison', label: 'Comparação', icon: GitCompare, group: 'tools' },
  { id: 'alerts', label: 'Alertas', icon: Bell, group: 'tools', badge: 1 },
  { id: 'history', label: 'Histórico', icon: History, group: 'tools' },
]

function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card p-6">
          <div className="h-4 bg-dark-400 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-3 bg-dark-400 rounded w-full" />
            <div className="h-3 bg-dark-400 rounded w-4/5" />
            <div className="h-3 bg-dark-400 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
