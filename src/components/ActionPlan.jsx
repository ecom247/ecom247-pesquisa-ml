import { Zap } from 'lucide-react'

export default function ActionPlan({ actions = [] }) {
  const defaultActions = actions.length ? actions : [
    'Analise os top 10 vendedores do nicho',
    'Defina um preço competitivo',
    'Otimize o título com palavras-chave',
    'Invista em fotos de qualidade',
    'Monitore métricas semanalmente'
  ]

  return (
    <div className="p-4 bg-[#111] rounded-xl border border-[#222]">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} className="text-[#FF6803]" />
        <h3 className="text-white font-semibold">Plano de Ação</h3>
      </div>
      <ol className="space-y-2">
        {defaultActions.map((action, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
            <span className="bg-[#FF6803] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            <span>{action}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}