import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

export default function ScoreCard({ title, value, score, trend }) {
  const Icon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const ScoreIcon = score >= 7 ? CheckCircle2 : score >= 4 ? AlertTriangle : XCircle
  const scoreColor = score >= 7 ? 'text-green-400' : score >= 4 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="bg-[#111] rounded-xl p-4 border border-[#222]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        <ScoreIcon className={scoreColor} size={16} />
      </div>
      <p className="text-white text-2xl font-bold">{value}</p>
      <div className="flex items-center gap-1 mt-1">
        <Icon size={14} className={trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'} />
        <span className="text-xs text-gray-400">Score: {score}/10</span>
      </div>
    </div>
  )
}