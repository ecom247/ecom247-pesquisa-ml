import { Link } from 'react-router-dom';
import { LogoOnDark } from '../components/Logo';
import { Search, BarChart2, TrendingUp, Shield, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/90 backdrop-blur-sm border-b border-dark-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <LogoOnDark />
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="bg-orange text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-orange-500 transition-colors"
              >
                Comecar Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-100 to-dark-200" />
        {/* Orange glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-orange/10 border border-orange/20 rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 bg-orange rounded-full animate-pulse" />
            <span className="text-orange text-sm font-medium">Pesquisa de Mercado para Mercado Livre</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Domine o{' '}
            <span className="text-orange">Mercado Livre</span>
            {' '}com Dados Reais
          </h1>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10">
            Analise concorrentes, descubra nichos lucrativos e tome decisoes baseadas em dados para escalar suas vendas no ML.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 bg-orange text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-orange-500 transition-all hover:scale-105"
            >
              Comecar Gratuitamente
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 border border-dark-400 text-gray-300 font-semibold text-lg px-8 py-4 rounded-xl hover:border-orange/40 hover:text-white transition-all"
            >
              Fazer Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Tudo que voce precisa para{' '}
              <span className="text-orange">vender mais</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Ferramentas profissionais de inteligencia de mercado para vendedores do Mercado Livre.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Search,
                title: 'Pesquisa de Produtos',
                desc: 'Encontre produtos lucrativos com alta demanda e baixa concorrencia.',
              },
              {
                icon: BarChart2,
                title: 'Analise de Concorrentes',
                desc: 'Monitore precos, vendas e estrategias dos seus concorrentes.',
              },
              {
                icon: TrendingUp,
                title: 'Tendencias de Mercado',
                desc: 'Identifique tendencias antes da concorrencia e capitalize oportunidades.',
              },
              {
                icon: Shield,
                title: 'Score de Viabilidade',
                desc: 'Calcule a viabilidade de cada produto com nosso algoritmo proprietario.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-dark-200 border border-dark-300 rounded-2xl p-6 hover:border-orange/30 transition-all"
              >
                <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={24} className="text-orange" />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-16">
            Por que escolher o <span className="text-orange">ECOM247</span>?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { value: '10.000+', label: 'Produtos Analisados' },
              { value: '500+', label: 'Vendedores Ativos' },
              { value: '3.2x', label: 'Aumento Medio de Vendas' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-dark-100 border border-dark-300 rounded-2xl p-8">
                <div className="text-5xl font-bold text-orange mb-2">{value}</div>
                <div className="text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-dark-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para dominar o <span className="text-orange">Mercado Livre</span>?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Comece gratuitamente hoje. Sem cartao de credito necessario.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              to="/register"
              className="flex items-center gap-2 bg-orange text-white font-bold text-lg px-10 py-4 rounded-xl hover:bg-orange-500 transition-all hover:scale-105"
            >
              Comecar Agora — Gratis
              <ArrowRight size={20} />
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400 text-sm">
            {['Sem cartao de credito', 'Cancele quando quiser', 'Suporte 24/7'].map((item) => (
              <div key={item} className="flex items-center gap-1">
                <CheckCircle size={16} className="text-orange" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark border-t border-dark-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <LogoOnDark />
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} ECOM247. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
