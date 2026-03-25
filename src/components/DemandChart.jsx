import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

export default function DemandChart({ data = [] }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">Analise de Demanda</h2>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
        <p className="text-gray-400 text-sm mb-4">Buscas e vendas mensais no Mercado Livre</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis dataKey="month" stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
            <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8 }} />
            <Legend wrapperStyle={{ color: '#999' }} />
            <Line type="monotone" dataKey="searches" stroke="#FF6803" name="Buscas" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="sales" stroke="#3B82F6" name="Vendas" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-orange-500 text-2xl font-bold">{data.length ? Math.max(...data.map(d=>d.searches)).toLocaleString() : 0}</p>
          <p className="text-gray-400 text-xs mt-1">Pico de buscas</p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-blue-400 text-2xl font-bold">{data.length ? Math.max(...data.map(d=>d.sales)).toLocaleString() : 0}</p>
          <p className="text-gray-400 text-xs mt-1">Pico de vendas</p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-green-400 text-2xl font-bold">{data.length ? (data.reduce((s,d)=>s+d.sales,0)/data.length).toFixed(0) : 0}</p>
          <p className="text-gray-400 text-xs mt-1">Media mensal</p>
        </div>
      </div>
    </div>
  )
}
