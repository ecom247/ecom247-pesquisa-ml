import { AlertTriangle, Info, CheckCircle, TrendingDown } from 'lucide-react'

export default function AlertsPage({ data = [] }) {
  const iconMap = {
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle,
    danger: TrendingDown,
  }
  const colorMap = {
    warning: 'text-yellow-400 bg-yellow-900/20 border-yellow-800',
    info: 'text-blue-400 bg-blue-900/20 border-blue-800',
    success: 'text-green-400 bg-green-900/20 border-green-800',
    danger: 'text-red-400 bg-red-900/20 border-red-800',
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-1">Alertas</h2>
      <p className="text-gray-400 text-sm mb-6">Monitoramento em tempo real do seu mercado</p>
      {data.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Nenhum alerta no momento.</p>
      ) : (
        <div className="space-y-3">
          {data.map((alert) => {
            const Icon = iconMap[alert.severity] || Info
            const colors = colorMap[alert.severity] || colorMap.info
            return (
              <div key={alert.id} className={`flex items-start gap-4 p-4 rounded-xl border ${colors}`}>
                <Icon size={20} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-white">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
