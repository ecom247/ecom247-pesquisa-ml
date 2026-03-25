export default function CompetitorTable({ data = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-gray-300">
        <thead><tr className="border-b border-[#222]"><th className="text-left p-3">Vendedor</th><th className="text-right p-3">Vendas</th><th className="text-right p-3">Preço</th></tr></thead>
        <tbody>{data.map((row, i) => (<tr key={i} className="border-b border-[#111]"><td className="p-3">{row.seller}</td><td className="text-right p-3">{row.sales}</td><td className="text-right p-3">{row.price}</td></tr>))}</tbody>
      </table>
    </div>
  )
}