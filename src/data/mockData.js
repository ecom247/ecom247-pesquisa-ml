// ECOM247 — Mock Data
// Apenas para seções que ainda não têm integração com a API real

export const mockSeasonality = [
  { month: 'Jan', index: 72 },
  { month: 'Fev', index: 68 },
  { month: 'Mar', index: 75 },
  { month: 'Abr', index: 80 },
  { month: 'Mai', index: 85 },
  { month: 'Jun', index: 78 },
  { month: 'Jul', index: 82 },
  { month: 'Ago', index: 88 },
  { month: 'Set', index: 91 },
  { month: 'Out', index: 95 },
  { month: 'Nov', index: 130 },
  { month: 'Dez', index: 185 },
]
export const mockSeasonalityData = mockSeasonality

export const mockMarketShare = [
  { name: 'Top Seller 1', value: 28, color: '#f97316' },
  { name: 'Top Seller 2', value: 21, color: '#fb923c' },
  { name: 'Top Seller 3', value: 15, color: '#fdba74' },
  { name: 'Top Seller 4', value: 12, color: '#fed7aa' },
  { name: 'Outros',       value: 24, color: '#374151' },
]
export const mockMarketShareData = mockMarketShare

export const mockComplaints = [
  { category: 'Produto diferente do anunciado', count: 42, percentage: 35 },
  { category: 'Atraso na entrega',              count: 28, percentage: 23 },
  { category: 'Produto com defeito',            count: 20, percentage: 17 },
  { category: 'Embalagem danificada',           count: 15, percentage: 12 },
  { category: 'Outros',                         count: 16, percentage: 13 },
]

export const mockActionPlan = [
  { priority: 'Alta',  action: 'Melhorar fotos do anuncio',          impact: 'Conversao +15%', deadline: '7 dias'  },
  { priority: 'Alta',  action: 'Ativar Mercado Envios Full',          impact: 'Vendas +25%',    deadline: '14 dias' },
  { priority: 'Media', action: 'Responder perguntas em menos de 1h', impact: 'Reputacao +10%', deadline: '30 dias' },
  { priority: 'Media', action: 'Coletar mais avaliacoes positivas',  impact: 'Conversao +8%',  deadline: '30 dias' },
  { priority: 'Baixa', action: 'Criar variacoes do produto',         impact: 'Ticket medio +5%', deadline: '45 dias' },
]

export const mockAlerts = [
  { type: 'warning', message: 'Concorrente reduziu preco em 12% ontem' },
  { type: 'info',    message: 'Demanda sazonal prevista para subir 40% em Nov' },
  { type: 'success', message: 'Sua taxa de conversao esta acima da media da categoria' },
  { type: 'warning', message: '3 novos vendedores entraram na categoria esta semana' },
]

export const mockCompetitors = [
  { id: 1, name: 'VendedorA', price: 129.90, sales: 850, rating: 4.8, reputation: 'Excelente', shipping: 'Full'   },
  { id: 2, name: 'VendedorB', price: 119.90, sales: 620, rating: 4.5, reputation: 'Muito Bom', shipping: 'Normal' },
  { id: 3, name: 'VendedorC', price: 139.90, sales: 410, rating: 4.7, reputation: 'Excelente', shipping: 'Full'   },
  { id: 4, name: 'VendedorD', price: 109.90, sales: 380, rating: 4.2, reputation: 'Bom',       shipping: 'Normal' },
  { id: 5, name: 'VendedorE', price: 149.90, sales: 290, rating: 4.9, reputation: 'Excelente', shipping: 'Full'   },
]

export const mockDemandData = [
  { month: 'Out', searches: 3200, sales: 760  },
  { month: 'Nov', searches: 4800, sales: 1140 },
  { month: 'Dez', searches: 7200, sales: 1710 },
  { month: 'Jan', searches: 2800, sales: 665  },
  { month: 'Fev', searches: 3200, sales: 760  },
  { month: 'Mar', searches: 3600, sales: 855  },
]

export const mockScore = {
  total: 72,
  demand: 35,
  competition: 20,
  price: 17,
  label: 'Boa Oportunidade',
  labelColor: 'yellow',
}
export const mockScoreData = mockScore

export const mockPriceDistribution = [
  { range: 'R$0-50',    count: 12 },
  { range: 'R$50-100',  count: 28 },
  { range: 'R$100-150', count: 45 },
  { range: 'R$150-200', count: 31 },
  { range: 'R$200-300', count: 18 },
  { range: 'R$300+',    count: 8  },
]

export const mockCategoryMetrics = {
  totalSellers:  342,
  avgPrice:      127.50,
  totalSales:    12840,
  avgConversion: 3.2,
  topBrand:      'Generico',
  growthRate:    18.5,
}

export const mockSearchHistory = [
  { id: 1, query: 'suporte celular veicular', score: 72, category: 'Acessorios', created_at: '2025-03-20T10:30:00Z' },
  { id: 2, query: 'fone bluetooth',           score: 58, category: 'Eletronicos', created_at: '2025-03-19T14:20:00Z' },
  { id: 3, query: 'organizador mala viagem',  score: 81, category: 'Viagem',      created_at: '2025-03-18T09:10:00Z' },
]
