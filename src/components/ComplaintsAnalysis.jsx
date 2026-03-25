import { AlertTriangle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export default function ComplaintsAnalysis({ complaints = [], suggestions = [] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="p-4 bg-[#111] rounded-xl border border-[#222]">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-yellow-400" />
          <h3 className="text-white font-semibold">Análise de Reclamações</h3>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {complaints.map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-red-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{c}</span>
            </div>
          ))}
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-green-300">
              <Lightbulb size={14} className="mt-0.5 shrink-0" /><span>{s}</span>
            </div>
          ))}
          {!complaints.length && !suggestions.length && <p className="text-gray-400 text-sm">Nenhuma reclamação encontrada.</p>}
        </div>
      )}
    </div>
  )
}