export default function DemandChart({ data = [] }) {
  return (
    <div className="p-4 bg-[#111] rounded-xl">
      <h3 className="text-white font-semibold mb-3">Demanda</h3>
      <div className="h-32 flex items-end gap-1">
        {data.map((v, i) => (
          <div key={i} style={{height: `${v}%`}} className="flex-1 bg-[#FF6803] rounded-t" />
        ))}
      </div>
    </div>
  )
}