import { Star, Truck } from 'lucide-react'

export default function CompetitorTable({ data = [] }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Analise de Concorrentes</h2>
      <div className="overflow-x-auto rounded-xl border border-dark-300">
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="bg-dark-200 border-b border-dark-300">
              <th className="text-left p-3 text-gray-400 font-medium">Vendedor</th>
              <th className="text-right p-3 text-gray-400 font-medium">Preco</th>
              <th className="text-right p-3 text-gray-400 font-medium">Vendas/mes</th>
              <th className="text-center p-3 text-gray-400 font-medium">Reputacao</th>
              <th className="text-center p-3 text-gray-400 font-medium">Frete</th>
              <th className="text-right p-3 text-gray-400 font-medium">Visitas</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-dark-300 hover:bg-dark-200 transition-colors">
                <td className="p-3 font-medium text-white">{row.name}</td>
                <td className="text-right p-3 text-orange-400 font-semibold">
                  R$ {Number(row.price).toFixed(2)}
                </td>
                <td className="text-right p-3">{row.sales?.toLocaleString('pt-BR')}</td>
                <td className="text-center p-3">
                  <div className="flex items-center justify-center gap-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span>{row.rating}</span>
                    <span className="text-gray-500 text-xs ml-1">{row.reputation}</span>
                  </div>
                </td>
                <td className="text-center p-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    row.shipping === 'Full'
                      ? 'bg-green-900/40 text-green-400'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    <Truck size={10} />
                    {row.shipping}
                  </span>
                </td>
                <td className="text-right p-3">{row.visits?.toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
