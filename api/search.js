import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ML_APP_ID = process.env.ML_APP_ID
const ML_SECRET_KEY = process.env.ML_SECRET_KEY
const ML_BASE = 'https://api.mercadolibre.com'
const UA = 'Mozilla/5.0 (compatible; NodeFetch/1.0)'

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function getValidToken() {
  const { data: row, error } = await adminSupabase.from('ml_tokens').select('*').eq('id', 1).single()
  if (error || !row) throw new Error('Tokens ML nao encontrados.')
  const expiresAt = new Date(row.expires_at).getTime()
  if (Date.now() > expiresAt - 10 * 60 * 1000) return refreshMLToken(row.refresh_token)
  return row.access_token
}

async function refreshMLToken(refreshTk) {
  const res = await fetch(ML_BASE + '/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body: new URLSearchParams({ grant_type: 'refresh_token', client_id: ML_APP_ID, client_secret: ML_SECRET_KEY, refresh_token: refreshTk }),
  })
  if (!res.ok) { const t = await res.text(); throw new Error('Refresh token falhou: ' + res.status + ' ' + t) }
  const tokens = await res.json()
  const newExp = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  await adminSupabase.from('ml_tokens').update({ access_token: tokens.access_token, refresh_token: tokens.refresh_token, expires_at: newExp, updated_at: new Date().toISOString() }).eq('id', 1)
  return tokens.access_token
}

async function mlGet(path, token) {
  const headers = { 'User-Agent': UA, 'Accept': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token
  const res = await fetch(ML_BASE + path, { headers })
  if (!res.ok) throw new Error('ML API ' + path.slice(0,60) + ' retornou ' + res.status)
  return res.json()
}

function calcScore(totalSales, numComp, avgPrice, fullCount) {
  const d = Math.min(40, Math.round((totalSales / 300) * 40))
  const c = Math.max(0, Math.round(30 - (numComp > 0 ? fullCount / numComp : 0) * 20 - (numComp > 8 ? 10 : 0)))
  const p = Math.min(30, Math.round((avgPrice / 500) * 30))
  return { demand: d, competition: c, price: p, total: d + c + p }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token necessario.' })
  const jwt = authHeader.slice(7)
  const { data: { user }, error: authErr } = await adminSupabase.auth.getUser(jwt)
  if (authErr || !user) return res.status(401).json({ error: 'Token invalido.' })

  const { query } = req.body || {}
  if (!query || !query.trim()) return res.status(400).json({ error: 'Informe o produto.' })

  try {
    let mlToken = null
    try { mlToken = await getValidToken() } catch(e) { console.warn('[ml] Token indisponivel:', e.message) }

    // Search using token if available (higher rate limits), else public
    let searchData
    try {
      searchData = await mlGet('/sites/MLB/search?q=' + encodeURIComponent(query.trim()) + '&limit=20&sort=sold_quantity_desc', mlToken)
    } catch(e) {
      // Try without sort if first attempt fails
      searchData = await mlGet('/sites/MLB/search?q=' + encodeURIComponent(query.trim()) + '&limit=20', null)
    }
    const items = searchData.results || []

    if (items.length === 0) {
      return res.status(200).json({ query, score: 0, scoreDetails: { demand: 0, competition: 0, price: 0, total: 0 }, competitors: [], demandData: [], totalSales: 0, avgPrice: 0, category: '' })
    }

    const topItems = items.slice(0, 10)
    const itemResults = await Promise.allSettled(topItems.map(item => mlGet('/items/' + item.id, mlToken)))
    const sellerIds = [...new Set(topItems.map(i => i.seller && i.seller.id).filter(Boolean))].slice(0, 6)
    const sellerResults = await Promise.allSettled(sellerIds.map(id => mlGet('/users/' + id, mlToken)))
    const sellers = {}
    sellerResults.forEach(r => { if (r.status === 'fulfilled' && r.value && r.value.id) sellers[r.value.id] = r.value })

    const REP = { green_aa: 'Excelente', green: 'Muito Bom', yellow: 'Bom', orange: 'Regular', red: 'Pessimo' }
    const competitors = topItems.map((item, i) => {
      const detail = (itemResults[i] && itemResults[i].status === 'fulfilled') ? itemResults[i].value : {}
      const seller = (item.seller && sellers[item.seller.id]) ? sellers[item.seller.id] : {}
      const rep = seller.seller_reputation || {}
      const txn = rep.transactions || {}
      const pos = txn.ratings ? txn.ratings.positive || 0 : 0
      return {
        id: item.id,
        name: seller.nickname || (item.seller && item.seller.nickname) || ('Vendedor ' + (i + 1)),
        price: item.price || 0,
        sales: detail.sold_quantity || item.sold_quantity || 0,
        rating: parseFloat(Math.max(3.5, pos * 5).toFixed(1)),
        reputation: REP[rep.power_seller_status] || REP[rep.level_id] || 'Bom',
        shipping: (detail.shipping && detail.shipping.logistic_type === 'fulfillment') ? 'Full' : 'Normal',
        visits: detail.health || 0,
        link: item.permalink || '',
        thumbnail: item.thumbnail || '',
        title: item.title || '',
      }
    })

    const totalSales = competitors.reduce((s, c) => s + c.sales, 0)
    const avgPrice = competitors.length > 0 ? competitors.reduce((s, c) => s + c.price, 0) / competitors.length : 0
    const scoreDetails = calcScore(totalSales, competitors.length, avgPrice, competitors.filter(c => c.shipping === 'Full').length)
    const score = scoreDetails.total
    const SEASON = [{ month: 'Out', f: 0.80 }, { month: 'Nov', f: 1.20 }, { month: 'Dez', f: 1.80 }, { month: 'Jan', f: 0.70 }, { month: 'Fev', f: 0.80 }, { month: 'Mar', f: 0.90 }]
    const base = Math.max(totalSales, 100)
    let label = 'Oportunidade Moderada', labelColor = 'orange'
    if (score >= 75) { label = 'Alta Oportunidade'; labelColor = 'green' }
    else if (score >= 55) { label = 'Boa Oportunidade'; labelColor = 'yellow' }

    const result = {
      query, score,
      scoreDetails: Object.assign({}, scoreDetails, { label, labelColor }),
      competitors,
      demandData: SEASON.map(s => ({ month: s.month, searches: Math.round(base * s.f * 4.2), sales: Math.round(base * s.f) })),
      totalSales, avgPrice: parseFloat(avgPrice.toFixed(2)),
      category: items[0] ? items[0].category_id : '',
      topItem: items[0] ? { id: items[0].id, title: items[0].title, thumbnail: items[0].thumbnail, permalink: items[0].permalink } : null,
    }

    await adminSupabase.from('search_history').insert({ user_id: user.id, query: query.trim(), results: result, score, category: result.category })
    return res.status(200).json(result)

  } catch (err) {
    console.error('[ml-search] Error:', err.message)
    return res.status(500).json({ error: err.message || 'Erro interno.' })
  }
}
