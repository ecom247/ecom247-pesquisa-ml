export const config = { runtime: 'edge', regions: ['gru1'] }

const ML_API_BASE = 'https://api.mercadolibre.com'

// ── Supabase helper ─────────────────────────────────────────────────────────
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
    throw new Error('Supa ' + method + ' ' + path + ' -> ' + res.status + ': ' + t.slice(0, 120))
  }
  return res.json()
}

// ── App token via client_credentials (não requer usuário) ────────────────────
// Sempre retorna token fresco — contorna tokens revogados no banco.
async function getAppToken(appId, appSecret) {
  if (!appId || !appSecret) return null
  const res = await fetch(ML_API_BASE + '/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: 'grant_type=client_credentials&client_id=' + appId + '&client_secret=' + appSecret
  })
  if (!res.ok) { console.warn('[ml] app token err:', res.status); return null }
  const d = await res.json()
  return d.access_token || null
}

// ── Token management (user token via refresh) ────────────────────────────────
async function getValidToken(supaUrl, serviceKey, appId, appSecret) {
  const rows = await supaFetch(supaUrl, serviceKey, 'GET', '/ml_tokens?id=eq.1&select=*')
  if (!rows?.length) throw new Error('No token row in ml_tokens')
  const row = rows[0]
  if (new Date(row.expires_at).getTime() - Date.now() > 5 * 60 * 1000) return row.access_token
  const refreshRes = await fetch(ML_API_BASE + '/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: 'grant_type=refresh_token&client_id=' + appId + '&client_secret=' + appSecret +
          '&refresh_token=' + encodeURIComponent(row.refresh_token)
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

// ── Busca itens via /sites/MLB/search ────────────────────────────────────────
// NOTA: sort=sold_quantity_desc requer escopo especial. Não incluímos para
// garantir compatibilidade com tokens de app (client_credentials).
// Ordenamos por sold_quantity client-side após receber os resultados.
async function searchMarketplaceItems(query, mlToken, offset, limit) {
  const url = ML_API_BASE + '/sites/MLB/search?q=' +
    encodeURIComponent(query) +
    '&limit=' + (limit || 50) +
    '&offset=' + (offset || 0)

  const headers = { 'Accept': 'application/json' }
  if (mlToken) headers['Authorization'] = 'Bearer ' + mlToken

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error('/sites/MLB/search -> ' + res.status + (errText ? ' ' + errText.slice(0,80) : ''))
  }
  return res.json()
}

// ── Main handler ────────────────────────────────────────────────────────────
export default async function handler(request) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  }

  if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors })
  }

  const SUPA_URL   = process.env.SUPABASE_URL
  const SUPA_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY
  const APP_ID     = process.env.ML_APP_ID
  const APP_SECRET = process.env.ML_APP_SECRET || process.env.ML_SECRET_KEY

  // ── Auth: verify Supabase user token ──────────────────────────────────────
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
    if (!userId) throw new Error('No user ID in token')
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Unauthorized: ' + e.message }), { status: 401, headers: cors })
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body
  try { body = await request.json() } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: cors })
  }
  const { query } = body
  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: 'Query required' }), { status: 400, headers: cors })
  }

  // ── Obter token ML ────────────────────────────────────────────────────────
  // Estratégia v9: tentar client_credentials PRIMEIRO (token fresco garantido).
  // Se falhar, tentar user token do Supabase como fallback.
  // Isso evita usar tokens revogados que ainda aparecem como "válidos" no banco.
  let mlToken = null

  // 1. Tentar app token (client_credentials) — sempre fresco
  try { mlToken = await getAppToken(APP_ID, APP_SECRET) } catch (e) {
    console.warn('[v9] app token err:', e.message)
  }
  console.log('[v9] app token obtained:', !!mlToken)

  // 2. Fallback: user token do banco
  if (!mlToken) {
    try { mlToken = await getValidToken(SUPA_URL, SUPA_KEY, APP_ID, APP_SECRET) } catch (e) {
      console.warn('[v9] user token err:', e.message)
    }
    console.log('[v9] user token fallback:', !!mlToken)
  }

  // ── Busca marketplace: 2 páginas paralelas ────────────────────────────────
  const doSearch = (tok) => Promise.all([
    searchMarketplaceItems(query.trim(), tok, 0, 50),
    searchMarketplaceItems(query.trim(), tok, 50, 50)
  ])

  let page1, page2
  try {
    [page1, page2] = await doSearch(mlToken)
  } catch (e) {
    console.error('[v9] search err:', e.message)
    // Se 403 com token atual, tentar sem token (endpoint pode ser público sem sort especial)
    if (e.message.includes('403') && mlToken) {
      console.warn('[v9] 403 with token, retrying without auth...')
      try {
        [page1, page2] = await doSearch(null)
      } catch (e2) {
        console.error('[v9] no-auth also failed:', e2.message)
        return new Response(JSON.stringify({ error: 'Falha ao buscar itens ML: ' + e2.message }), {
          status: 500, headers: cors
        })
      }
    } else {
      return new Response(JSON.stringify({ error: 'Falha ao buscar itens ML: ' + e.message }), {
        status: 500, headers: cors
      })
    }
  }

  const total = page1.paging?.total || 0
  const allItems = [
    ...(page1.results || []),
    ...(page2.results || [])
  ]

  console.log('[v9] total ML:', total, 'items fetched:', allItems.length)

  // ── Agrupa por vendedor ────────────────────────────────────────────────────
  const sellerMap = {}

  for (const item of allItems) {
    const sellerId = item.seller?.id
    if (!sellerId) continue

    if (!sellerMap[sellerId]) {
      sellerMap[sellerId] = {
        seller_id:       sellerId,
        seller_nickname: item.seller?.nickname || ('Vendedor ' + sellerId),
        items:           [],
        total_sold:      0,
        has_official_store: !!item.official_store_id
      }
    }

    const entry = sellerMap[sellerId]
    entry.items.push(item)
    entry.total_sold += (item.sold_quantity || 0)
    if (item.official_store_id) entry.has_official_store = true
  }

  // Ordena vendedores por quantidade vendida (mais relevantes primeiro)
  const sellers = Object.values(sellerMap).sort((a, b) => b.total_sold - a.total_sold)

  // Top 10 vendedores únicos
  const competitors = sellers.slice(0, 10).map(s => {
    const bestItem = s.items.sort((a, b) => (b.sold_quantity || 0) - (a.sold_quantity || 0))[0]
    const prices   = s.items.map(i => i.price).filter(p => p > 0)
    const minPrice = prices.length ? Math.min(...prices) : 0
    const maxPrice = prices.length ? Math.max(...prices) : 0
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    const freeShip = s.items.filter(i => i.shipping?.free_shipping).length / Math.max(1, s.items.length)
    const goldListings = s.items.filter(i => i.listing_type_id?.startsWith('gold')).length

    return {
      id:            bestItem.id,
      seller_id:     s.seller_id,
      seller:        s.seller_nickname,
      title:         bestItem.title,
      price:         Math.round(avgPrice * 100) / 100,
      min_price:     minPrice,
      max_price:     maxPrice,
      sold:          s.total_sold,
      item_count:    s.items.length,
      rating:        0,
      url:           bestItem.permalink || ('https://www.mercadolivre.com.br/p/' + (bestItem.catalog_product_id || bestItem.id)),
      thumbnail:     bestItem.thumbnail || '',
      condition:     bestItem.condition || 'new',
      shipping_free: freeShip > 0.5,
      free_ship_pct: Math.round(freeShip * 100),
      has_official_store: s.has_official_store,
      gold_listings: goldListings,
      brand:         bestItem.attributes?.find(a => a.id === 'BRAND')?.value_name || ''
    }
  })

  // ── Market stats ──────────────────────────────────────────────────────────
  const allPrices    = allItems.map(i => i.price).filter(p => p > 0)
  const avgPrice     = allPrices.length
    ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length)
    : 0
  const totalSellers = sellers.length
  const totalSold    = allItems.reduce((s, i) => s + (i.sold_quantity || 0), 0)

  const topItem = allItems.reduce((top, i) =>
    (!top || (i.sold_quantity || 0) > (top.sold_quantity || 0)) ? i : top, null)

  // ── Opportunity score ─────────────────────────────────────────────────────
  const hasHighDemand   = total > 1000 || totalSold > 500
  const hasGoodMargin   = avgPrice > 50
  const hasHighComp     = totalSellers > 200 || total > 5000
  const hasFreeShipping = allItems.some(i => i.shipping?.free_shipping)

  let score = 45
  if (hasHighDemand)   score += 20
  if (hasGoodMargin)   score += 15
  if (!hasHighComp)    score += 10
  if (hasFreeShipping) score += 10
  score = Math.min(100, Math.max(0, score))

  // ── Demand chart ──────────────────────────────────────────────────────────
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const base = Math.max(totalSold, 100) / 12
  const demandData = months.map(month => ({
    month,
    sales: Math.round(base * (0.7 + Math.random() * 0.6))
  }))

  const scoreDetails = {
    demand:      hasHighDemand   ? 'Alta demanda'         : 'Demanda moderada',
    competition: hasHighComp     ? 'Alta concorrência'    : 'Baixa concorrência',
    margin:      hasGoodMargin   ? 'Margem boa'           : 'Margem baixa',
    shipping:    hasFreeShipping ? 'Frete grátis comum'   : 'Frete pago comum'
  }

  // ── Salva histórico ───────────────────────────────────────────────────────
  try {
    await supaFetch(SUPA_URL, SUPA_KEY, 'POST', '/search_history', {
      user_id:  userId,
      query:    query.trim(),
      score,
      results:  { competitors: competitors.length, avgPrice, totalSales: totalSold, total },
      category: null
    })
  } catch (e) {
    console.warn('[ml] history save err:', e.message)
  }

  return new Response(JSON.stringify({
    competitors,
    demandData,
    score,
    scoreDetails,
    avgPrice,
    totalSales: totalSold,
    topItem: topItem ? {
      title: topItem.title,
      price: topItem.price,
      sold:  topItem.sold_quantity,
      url:   topItem.permalink || ''
    } : null,
    query: query.trim(),
    total,
    searchMode: 'marketplace-search-v9',
    market: {
      totalListings:    total,
      itemsFetched:     allItems.length,
      uniqueSellers:    totalSellers,
      avgPrice,
      totalSold
    }
  }), { headers: cors })
}
