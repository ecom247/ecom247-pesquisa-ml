// ECOM247 — Mock Data
// Apenas para seções que ainda não têm integração com a API real:
// Sazonalidade, Market Share, Reclamações, Plano IA, Alertas

export const mockSeasonality = [
  { month: 'Jan', index: 72 },
  { month: 'Fev', index: 68 },
  { month: 'Mar', index: 75 },
  { month: 'Abr', inzex: 80 },
  { month: 'Mai', index: 85 },
  { month: 'Jun', index: 78 },
  { month: 'Jul', index: 82 },
  { month: 'Ago', index: 88 },
  { month: 'Set', index: 91 },
  { month: 'Out', index: 95 },
  { month: 'Nov', index: 130 },
  { month: 'Dez', index: 185 },
]

export const mockMarketShare = [
  { name: 'Top Seller 1', value: 28, color: '#f97316' },
  { name: 'Top Seller 2', value: 21, color: '#fb923c' },
  { name: 'Top Seller 3', value: 15, color: '#fdba74' },
  { name: 'Top Seller 4', value: 12, color: '#fed7aa' },
  { name: 'Outros',       value: 24, color: '#374151' },
]

export const mockComplaints = [
  { category: 'Produto diferente do anunciado', count: 42, percentage: 35 },
  { category: 'Atraso na entrega',              count: 30, percentage: 25 },
  { category: 'Produto com defeito',            count: 24, percentage: 20 },
  { category: 'Atendimento ruim',               count: 14, percentage: 12 },
  { category: 'Outros',                         count:  9, percentage: 8  },
]

export const mockActionPlan = [
  {
    priority: 'alta',
    title: 'Habilitar Mercado Envios Full',
    description: 'Produtos com Full têm +35% de conversão. Envie estoque para o CD do ML.',
    impact: '+35% conversão',
  },
  {
    priority: 'alta',
    title: 'Otimizar título com palavras-chave',
    description: 'Inclua modelo, marca e especificações técnicas no título para melhorar o ranqueamento.',
    impact: '+20% visibilidade',
  },
  {
    priority: 'media',
    title: 'Montar kit ou combo',
    description: 'Oferecer kits aumenta o ticket médio e reduz a comparação direta de preço.',
    impact: '+15% ticket médio',
  },
  {
    priority: 'media',
    title: 'Acumular avaliações iniciais',
    description: 'Produtos com 20+ avaliações têm 2x mais chances de aparecer no topo.',
    impact: '2x exposição',
  },
  {
    priority: 'baixa',
    title: 'Ativar Campanhas de Produto',
    description: 'Use o painel de anúncios do ML para ganhar posicionamento em palavras estratégicas.',
    impact: '+10% visitas',
  },
]

export const mockAlerts = [
  {
    id: 1,
    severity: 'warning',
    message: 'Concorrente baixou o preço para R$ 169,90 — você está R$ 20 acima da média.',
    time: 'há 2 horas',
  },
  {
    id: 2,
    severity: 'info',
    message: 'Volume de buscas cresceu 18% nos últimos 7 dias nesta categoria.',
    time: 'há 5 horas',
  },
  {
    id: 3,
    severity: 'danger',
    message: 'Novo vendedor entrou com frete Full e preço competitivo.',
    time: 'há 1 dia',
  },
]

// ─── Legado — mantido para compatibilidade com componentes não atualizados ────
export const mockCompetitors = []
export const mockDemandData = []
export const mockScore = 0
