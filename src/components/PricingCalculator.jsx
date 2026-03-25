import { useState } from 'react'

export default function PricingCalculator() {
  const [cost, setCost] = useState('')
  const [price, setPrice] = useState('')
  const margin = cost && price ? (((price - cost) / price) * 100).toFixed(1) : null
  return (
    <div className="p-4 bg-[#111] rounded-xl">
      <h3 className="text-white font-semibold mb-3">Calculadora de Preços</h3>
      <div className="space-y-3">
        <input type="number" placeholder="Custo (R$)" value={cost} onChange={e=>setCost(e.target.value)} className="w-full p-3 bg-[#1A1A1A] text-white rounded-lg" />
        <input type="number" placeholder="Preço (R$)" value={price} onChange={e=>setPrice(e.target.value)} className="w-full p-3 bg-[#1A1A1A] text-white rounded-lg" />
        {margin && <p className="text-[#FF6803] font-bold">Margem: {margin}%</p>}
      </div>
    </div>
  )
}