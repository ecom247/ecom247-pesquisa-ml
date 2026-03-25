import { Zap, Tag, Truck, Target, Camera, BarChart2 } from 'lucide-react'

const typeIcons = { pricing: Tag, shipping: Truck, listing: Target, content: Camera, monitoring: BarChart2 }
const impactStyle = {
  alto: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  medio: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  baixo: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
}

export default function ActionPlan({ data = [] }) {
  const actions = data.length ? data : [
    { priority: 1, action: 'Analise os top 10 vendedores do nicho', type: 'monitoring', impact: 'alto' },
    { priority: 2, action: 'Defina um preco competitivo', type: 'pricing', impact: 'alto' },
    { priority: 3, action: 'Otimize o titulo com palavras-chave', type: 'listing', impact: 'medio' },
    { priority: 4, action: 'Invista em fotos de qualidade', type: 'content', impact: 'medio' },
    { priority: 5, action: 'Monitore metricas semanalmente', type: 'monitoring', impact: 'baixo' },
  ]
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">Plano de Acao IA</h2>
      <div className="space-y-3">
        {actions.map((item, i) => {
          const Icon = typeIcons[item.type] || Zap
          const style = impactStyle[item.impact] || impactStyle.baixo
          return (
            <div key={i} className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center gap-4 hover:border-orange-500/30 transition-colors">
              <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center shrink-0">
                <Icon size={16} className="text-orange-500" />
              </div>
              <span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-xs text-gray-400 shrink-0">{item.priority}</span>
              <p className="text-white text-sm flex-1">{item.action}</p>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full border shrink-0 ${style}`}>{item.impact}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
