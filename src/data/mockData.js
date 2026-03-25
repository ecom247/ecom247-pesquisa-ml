// Mock Data for ECOM247 - Pesquisa de Mercado ML

export const mockCompetitors = [
  { id: 1, name: 'TechStore ML', price: 189.90, sales: 1240, rating: 4.8, reputation: 'Excelente', shipping: 'Full', visits: 8900 },
  { id: 2, name: 'EletroShop', price: 179.90, sales: 980, rating: 4.6, reputation: 'Muito Bom', shipping: 'Full', visits: 7200 },
  { id: 3, name: 'MegaDeals', price: 195.00, sales: 760, rating: 4.3, reputation: 'Muito Bom', shipping: 'Normal', visits: 5100 },
  { id: 4, name: 'SuperMall', price: 169.90, sales: 620, rating: 4.1, reputation: 'Bom', shipping: 'Normal', visits: 4300 },
  { id: 5, name: 'FastBuy', price: 210.00, sales: 410, rating: 4.7, reputation: 'Excelente', shipping: 'Full', visits: 3800 },
]

export const mockDemandData = [
  { month: 'Out', searches: 4200, sales: 890 },
  { month: 'Nov', searches: 5800, sales: 1240 },
  { month: 'Dez', searches: 9200, sales: 2100 },
  { month: 'Jan', searches: 3800, sales: 720 },
  { month: 'Fev', searches: 4100, sales: 810 },
  { month: 'Mar', searches: 4600, sales: 940 },
]

export const mockPriceDistribution = [
  { range: 'R$ 100-150', count: 12, pct: 15 },
  { range: 'R$ 150-200', count: 38, pct: 47 },
  { range: 'R$ 200-250', count: 22, pct: 27 },
  { range: 'R$ 250+', count: 9, pct: 11 },
]

export const mockCategoryMetrics = {
  totalSellers: 81,
  avgPrice: 187.50,
  totalSales: 12400,
  growthRate: 23,
  competitionLevel: 'Medio',
  avgRating: 4.5,
}

export const mockScoreData = {
  overall: 78,
  demand: 85,
  competition: 62,
  margin: 71,
  trend: 82,
  opportunity: 74,
  verdict: 'Boa Oportunidade',
  summary: 'Produto com demanda consistente e margem viavel. Competicao moderada com espaco para novos vendedores.',
}

export const mockSearchHistory = [
  { id: 1, query: 'Fone Bluetooth JBL', date: '2026-03-24', score: 78, category: 'Eletronicos' },
  { id: 2, query: 'Mouse Gamer RGB', date: '2026-03-23', score: 65, category: 'Informatica' },
  { id: 3, query: 'Teclado Mecanico', date: '2026-03-22', score: 71, category: 'Informatica' },
  { id: 4, query: 'Caixa de Som Bluetooth', date: '2026-03-20', score: 82, category: 'Eletronicos' },
  { id: 5, query: 'Smartwatch Xiaomi', date: '2026-03-18', score: 69, category: 'Relogios' },
]

export const mockSeasonalityData = [
  { month: 'Jan', index: 72 },
  { month: 'Fev', index: 68 },
  { month: 'Mar', index: 75 },
  { month: 'Abr', index: 70 },
  { month: 'Mai', index: 73 },
  { month: 'Jun', index: 69 },
  { month: 'Jul', index: 74 },
  { month: 'Ago', index: 76 },
  { month: 'Set', index: 80 },
  { month: 'Out', index: 88 },
  { month: 'Nov', index: 120 },
  { month: 'Dez', index: 145 },
]

export const mockMarketShareData = [
  { name: 'TechStore ML', value: 28, color: '#FF6803' },
  { name: 'EletroShop', value: 22, color: '#3B82F6' },
  { name: 'MegaDeals', value: 17, color: '#10B981' },
  { name: 'SuperMall', value: 14, color: '#8B5CF6' },
  { name: 'Outros', value: 19, color: '#6B7280' },
]

export const mockComplaints = [
  { category: 'Entrega atrasada', count: 45, pct: 38, sentiment: 'negative' },
  { category: 'Produto diferente', count: 28, pct: 24, sentiment: 'negative' },
  { category: 'Qualidade boa', count: 22, pct: 19, sentiment: 'positive' },
  { category: 'Atendimento rapido', count: 15, pct: 13, sentiment: 'positive' },
  { category: 'Preco justo', count: 8, pct: 7, sentiment: 'positive' },
]

export const mockActionPlan = [
  { priority: 1, action: 'Precificar entre R$ 175-185 para competir com top vendedores', type: 'pricing', impact: 'alto' },
  { priority: 2, action: 'Ativar frete Full para aumentar visibilidade nos resultados', type: 'shipping', impact: 'alto' },
  { priority: 3, action: 'Criar anuncio Classico com titulo otimizado de 60 caracteres', type: 'listing', impact: 'medio' },
  { priority: 4, action: 'Adicionar pelo menos 8 fotos de alta qualidade incluindo video', type: 'content', impact: 'medio' },
  { priority: 5, action: 'Monitorar precos dos top 3 concorrentes diariamente', type: 'monitoring', impact: 'baixo' },
]

export const mockAlerts = [
  { id: 1, type: 'price', message: 'TechStore ML reduziu preco em 8%', time: '2h atras', severity: 'warning' },
  { id: 2, type: 'competitor', message: 'Novo vendedor Full entrou na categoria', time: '5h atras', severity: 'info' },
  { id: 3, type: 'demand', message: 'Busca pelo produto aumentou 34% na ultima semana', time: '1d atras', severity: 'success' },
]
