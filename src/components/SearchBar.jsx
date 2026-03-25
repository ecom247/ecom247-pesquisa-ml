import { useState, useRef } from 'react'

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim() && onSearch) onSearch(query.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Pesquisar produto no ML..."
        className="flex-1 p-3 bg-[#1A1A1A] text-white rounded-lg border border-[#333] focus:border-[#FF6803] outline-none"
      />
      <button type="submit" className="px-6 py-3 bg-[#FF6803] text-white rounded-lg font-semibold hover:bg-orange-600 transition">
        Pesquisar
      </button>
    </form>
  )
}