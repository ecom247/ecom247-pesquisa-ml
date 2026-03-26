import { supabase } from './supabase'

export async function searchML(query) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autenticado')

  const res = await fetch('/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Erro ${res.status}`)
  }

  return res.json()
}

export async function getHistory() {
  const { data, error } = await supabase
    .from('search_history')
    .select('id, query, score, category, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}
