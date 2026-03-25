import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#FF6803', '#FF9A3C', '#FFB870', '#FED09A', '#FEE0C0']

export default function MarketShareChart({ data = [] }) {
  const chartData = data.length ? data : [
    { name: 'Você', value: 0 },
    { name: 'Concorrente 1', value: 0 }
  ]

  return (
    <div className="p-4 bg-[#111] rounded-xl">
      <h3 className="text-white font-semibold mb-3">Share de Mercado</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => `${v}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}