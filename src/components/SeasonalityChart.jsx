import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function SeasonalityChart({ data = [] }) {
  const chartData = MONTHS.map((m, i) => ({ month: m, vendas: data[i] || 0 }))

  return (
    <div className="p-4 bg-[#111] rounded-xl">
      <h3 className="text-white font-semibold mb-3">Sazonalidade</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData}>
          <XAxis dataKey="month" stroke="#666" tick={{ fill: '#999', fontSize: 11 }} />
          <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="vendas" fill="#FF6803" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}