import { Clock, TrendingUp, Search, Trash2, ChevronRight } from 'lucide-react'

export default function SearchHistory({ history = [], onSelect, onClear }) {
  if (!history.length) return null

  return (
    <div className="p-4 bg-[#111] rounded-xl border border-[#222]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <h3 className="text-white font-semibold">Histórico</h3>
        </div>
        {onClear && (
          <button onClick={onClear} className="text-gray-500 hover:text-red-400 transition">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="space-y-1">
        {history.map((item, i) => (
          <button key={i} onClick={() => onSelect && onSelect(item)} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[#1A1A1A] transition text-left">
            <Search size={13} className="text-gray-500 shrink-0" />
            <span className="text-gray-300 text-sm flex-1">{item}</span>
            <ChevronRight size={13} className="text-gray-600" />
          </button>
        ))}
      </div>
    </div>
  )
}