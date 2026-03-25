import { Clock, Search, ChevronRight } from 'lucide-react'

export default function SearchHistory({ data = [], onSelect }) {
  if (!data.length) return (
    <div className="p-6 text-center">
      <Clock size={40} className="text-gray-600 mx-auto mb-3" />
      <p className="text-gray-500">Nenhuma pesquisa no historico.</p>
    </div>
  )
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">Historico de Pesquisas</h2>
      <div className="space-y-2">
        {data.map((item) => (
          <button key={item.id} onClick={() => onSelect && onSelect(item.query)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-orange-500/40 transition-all text-left flex items-center gap-4 group">
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
              <Search size={16} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{item.query}</p>
              <p className="text-gray-500 text-xs mt-0.5">{item.category} · {item.date}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-orange-500 font-bold text-sm">{item.score}</p>
                <p className="text-gray-500 text-xs">score</p>
              </div>
              <ChevronRight size={16} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
