import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

export default function ScoreCard({ data = {}, product = '' }) {
  const { overall = 0, demand = 0, competition = 0, margin = 0, trend = 0, opportunity = 0, verdict = '-', summary = '' } = data
  const getColor = v => v >= 75 ? 'text-green-400' : v >= 50 ? 'text-yellow-400' : 'text-red-400'
  const getBg = v => v >= 75 ? 'bg-green-400/10 border-green-400/20' : v >= 50 ? 'bg-yellow-400/10 border-yellow-400/20' : 'bg-red-400/10 border-red-400/20'
  const getIcon = v => v >= 75 ? CheckCircle2 : v >= 50 ? AlertTriangle : XCircle
  const metrics = [
    { label: 'Demanda', value: demand },
    { label: 'Concorrencia', value: competition },
    { label: 'Margem', value: margin },
    { label: 'Tendencia', value: trend },
    { label: 'Oportunidade', value: opportunity },
  ]
  const OverallIcon = getIcon(overall)
  const circ = 2 * Math.PI * 40
  return (
    <div className="p-6 space-y-6">
      {product && <h2 className="text-xl font-bold text-white">Analise: <span className="text-orange-500">{product}</span></h2>}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-24 h-24 shrink-0">
          <svg width="96" height="96" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#333" strokeWidth="10" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#FF6803" strokeWidth="10"
              strokeDasharray={`${circ * overall / 100} ${circ}`}
              strokeLinecap="round" transform="rotate(-90 50 50)" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{overall}</span>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-gray-400 text-sm mb-1">Score Geral de Viabilidade</p>
          <p className={`text-2xl font-bold mb-2 ${getColor(overall)}`}>{verdict}</p>
          <p className="text-gray-400 text-sm">{summary}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(({ label, value }) => {
          const Icon = getIcon(value)
          return (
            <div key={label} className={`rounded-xl p-4 border ${getBg(value)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">{label}</span>
                <Icon size={16} className={getColor(value)} />
              </div>
              <div className="flex items-end gap-1">
                <span className={`text-3xl font-bold ${getColor(value)}`}>{value}</span>
                <span className="text-gray-500 text-sm mb-1">/100</span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${value >= 75 ? 'bg-green-400' : value >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{width: value + '%'}} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
