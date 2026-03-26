export const config = { runtime: 'edge', regions: ['gru1'] }

const ML_BASE = 'https://api.mercadolibre.com'

async function supaFetch(supaUrl, serviceKey, method, path, body) {
  const res = await fetch(supaUrl + '/rest/v1' + path, {
    method: method || 'GET',
    headers: {
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error('Supa ' + method + ' ' + path + ' -> ' + res.status + ': ' + t.slice(0,120))
  }
  return res.json()
}

async function getValidToken(supaUrl, serviceKey, appId, appSecret) {
  const rows = await supaFetch(supaUrl, serviceKey, 'GET', '/ml_tokens?id=eq.1&select=*')
  if (!rows?.length) throw new Error('No token row')
  const row = rows[0]
  if (new Date(row.expires_at).getTime() - Date.now() > 5 * 60 * 1000) return row.access_token
  const refreshRes = await fetch(ML_BASE + '/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: 'grant_type=refresh_token&client_id=' + appId + '&client_secret=' + appSecret + '&refresh_token=' + encodeURIComponent(row.refresh_token)
  })
  if (!refreshRes.ok) { console.warn('[ml] refresh failed:', refreshRes.status); return row.access_token }
  const d = await refreshRes.json()
  const newExpiry = new Date(Date.now() + (d.expires_in - 300) * 1000).toISOString()
  await supaFetch(supaUrl, serviceKey, 'PATCH', '/ml_tokens?id=eq.1', {
    access_token: d.access_token,
    refresh_token: d.refresh_token || row.refresh_token,
    expires_at: newExpiry,
    updated_at: new Date().toISOString()
  })
  return d.access_token
}

export default async function handler(request) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  }
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors })

  const SUPA_URL = process.env.SUPABASE_URL
  const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const APP_ID = process.env.ML_APP_ID
  const APP_SECRET = process.env.ML_APP_SECRET

  let userId
  try {
    const auth = request.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) throw new Error('No auth header')
    const userRes = await fetch(SUPA_URL + '/auth/v1/user', {
      headers: { 'apikey': SUPA_KEY, 'Authorization': auth }
    })
    if (!userRes.ok) throw new Error('Token invalid: ' + userRes.status)
    const u = await userRes.json()
    userId = u.id
    if (!userId) throw new Error('No user ID')
  } catch(e) {
    return new Response(JSON.stringify({ error: 'Unauthorized: ' + e.message }), { status: 401, headers: cors })
  }

  let body
  try { body = await request.json() } catch(e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: cors })
  }
  const { query } = body
  if (!query?.trim()) return new Response(JSON.stringify({ error: 'Query required' }), { status: 400, headers: cors })

  const q = encodeURIComponent(query.trim())
  let mlToken = null
  try { mlToken = await getValidToken(SUPA_URL, SUPA_KEY, APP_ID, APP_SECRET) } catch(e) { console.warn('[ml] token err:', e.message) }

  let searchData
  try {
    const hdrs = { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; ECOM247/1.0)' }
    if (mlToken) hdrs['Authorization'] = 'Bearer ' + mlToken
    let res = await fetch(ML_BASE + '/sites/MLB/search?q=' + q + '&limit=20&sort=sold_quantity_desc', { headers: hdrs })
    if (!res.ok) {
      console.warn('[ml] with token failed', res.status, ', trying without...')
      res = await fetch(ML_BASE + '/sites/MLB/search?q=' + q + '&limit=20', { headers: { 'Accept': 'application/json' } })
    }
    if (!res.ok) throw new Error('ML API /sites/MLB/search retornou ' + res.status)
    searchData = await res.json()
  } catch(e) {
    console.error('[ml-search] Error:', e.message)
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors })
  }

  const items = searchData.results || []
  const competitors = items.slice(0, 10).map(item => ({
    id: item.id, title: item.title, price: item.price,
    sold: item.sold_quantity || 0, seller: item.seller?.nickname || 'N/A',
    rating: item.reviews?.rating_average || 0, url: item.permalink,
    thumbnail: item.thumbnail, condition: item.condition,
    shipping_free: item.shipping?.free_shipping || false
  }))
  const prices = items.map(i => i.price).filter(p => p > 0)
  const avgPrice = prices.length ? Math.round(prices.reduce((a,b) => a+b, 0) / prices.length) : 0
  const totalSales = items.reduce((sum, i) => sum + (i.sold_quantity || 0), 0)
  const topItem = items.reduce((top, item) => (!top || (item.sold_quantity||0) > (top.sold_quantity||0)) ? item : top, null)

  const hasHighDemand = totalSales > 500
  const hasCompetition = items.length >= 10
  const hasGoodMargin = avgPrice > 50
  const freePct = items.filter(i => i.shipping?.free_shipping).length / Math.max(items.length, 1)
  let score = 45
  if (hasHighDemand) score += 20
  if (hasGoodMargin) score += 15
  if (!hasCompetition) score += 10
  if (freePct > 0.5) score += 10
  score = Math.min(100, Math.max(0, score))

  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const base = totalSales / 12
  const demandData = months.map(month => ({ month, sales: Math.round(base * (0.7 + Math.random() * 0.6)) }))

  const scoreDetails = {
    demand: hasHighDemand ? 'Alta demanda' : 'Demanda moderada',
    competition: hasCompetition ? 'Alta concorrência' : 'Baixa concorrência',
    margin: hasGoodMargin ? 'Margem boa' : 'Margem baixa',
    shipping: freePct > 0.5 ? 'Frete grátis dominante' : 'Frete pago comum'
  }

  try {
    await supaFetch(SUPA_URL, SUPA_KEY, 'POST', '/search_history', {
      user_id: userId, query: query.trim(), score,
      results: { competitors: competitors.length, avgPrice, totalSales },
      category: searchData.filters?.find(f => f.id === 'category')?.values?.[0]?.name || null
    })
  } catch(e) { console.warn('[ml] history save err:', e.message) }

  return new Response(JSON.stringify({
    competitors, demandData, score, scoreDetails, avgPrice, totalSales,
    topItem: topItem ? { title: topItem.title, price: topItem.price, sold: topItem.sold_quantity, url: topItem.permalink } : null,
    query: query.trim(), total: searchData.paging?.total || 0
  }), { headers: cors })
}
