import { Link } from 'react-router-dom'
import {
  TrendingUp, BarChart2, DollarSign, Star, ArrowRight,
  Search, Upload, Link as LinkIcon, CheckCircle2, Zap,
  Users, Target, FileText, Shield
} from 'lucide-react'
import { LogoOnDark } from '../components/Logo'

const features = [
  {
    icon: TrendingUp,
    title: "Análise de Demanda",
    desc: "Veja a tendência real de buscas e volume de vendas da categoria nos últimos 6 meses.",
    color: "from-[#FF6803] to-orange-400",
  },
  {
    icon: Users,
    title: "Análise de Concorrentes",
    desc: "Identifique os top vendedores, seus preços, reputação e estratégias de venda.",
    color: "from-blue-500 to-blue-400",
  },
  {
    icon: DollarSign,
    title: "Calculadora de Precificação",
    desc: "Calcule automaticamente tarifas do ML, margem ideal e preço máximo de compra no fornecedor.",
    color: "from-green-500 to-emerald-400",
  },
  {
    icon: Target,
    title: "Score de Oportunidade",
    desc: "Receba uma nota de 0 a 100 com análise completa se o produto vale ou não a pena vender.",
    color: "from-purple-500 to-violet-400",
  },
  {
    icon: FileText,
    title: "Relatório em PDF",
    desc: "Exporte um relatório profissional completo com todos os dados da pesquisa.",
    color: "from-pink-500 to-rose-400",
  },
  {
    icon: Shield,
    title: "Histórico de Pesquisas",
    desc: "Accesse e compare todas as suas pesquisas anteriores em qualquer momento.",
    color: "from-yellow-500 to-amber-400",
  },
]

const inputMethods = [
  { icon: Search, label: "Digitando o produto", desc: "Ex: fone bluetooth jbl" },
  { icon: Upload, label: "Enviando uma foto", desc: "A :! IdeTcOcd�o/ o produto" },
  { icon: LinkIcon, label: "Colando link do ML", desc: "Análise direta do anúncio" },
]

const stats = [
  { value: "12.4k+", label: "Pesquisas realizadas" },
  { value: "R$ 4.8M", label: "Em receita analisada" },
  { value: "847", label: "Categorias mapeadas" },
  { value: "98%", label: "Taxa de satisfação" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark font-poppins overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-100/95 backdrop-blur-md border-b border-dark-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <LogoOnDark size="sm" />
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="px-5 py-2 bg-[#FF6803] hover:bg-orange-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 orange-glow-sm"
              >
                Começar Grátis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-100 to-dark-200" />
        {/* 