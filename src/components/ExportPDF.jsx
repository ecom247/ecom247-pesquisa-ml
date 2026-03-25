export default function ExportPDF() {
  return (
    <button onClick={() => window.print()} className="px-4 py-2 bg-[#FF6803] text-white rounded-lg font-semibold hover:bg-orange-600 transition">
      Exportar PDF
    </button>
  )
}