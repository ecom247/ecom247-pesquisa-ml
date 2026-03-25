import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from 'recharts'

export default function SeasonalityChart({ data = [] }) {
  const getColor = v => v >= 110 ? '#FF6803' : v >= 80 ? '#F59E0B' : '#3B82F6'
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">Sazonalidade</h2>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
        <p className="text-gray-400 text-sm mb-4">Indice de sazonalidade (100 = media anual). Laranja = pico de demanda.</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis dataKey="month" stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
            <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 12 }} domain={[0, 160]} />
            <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8 }}
              formatter={(v) => [v, 'Indice']} />
            <ReferenceLine y={100} stroke="#555" strokeDasharray="4 4" label={{ value: 'Media', fill: '#666', fontSize: 11 }} />
            <Bar dataKey="index" radius={[4,4,0,0]}>
              {data.map((entry, i) => <Cell key={i} fill={getColor(entry.index)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500 inline-block" />Pico (&gt;110)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500 inline-block" />Alta (80-110)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block" />Normal (&lt;80)</span>
        </div>
      </div>
    </div>
  )
}
