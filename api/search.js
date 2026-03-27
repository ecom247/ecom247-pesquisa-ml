export const config = { runtime: 'edge', regions: ['gru1'] }

const ML_BASE = 'https://api.mercadolibre.com'

// ── Supabase helper ────────────────────────────────────────────────────────
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

// ── Token management ───────────────────────────────────────────────────────
async function getValidToken(supaUrl, serviceKey, appId, appSecret) {
  const rows = await supaFetch(supaUrl, serviceKey, 'GET', '/ml_tokens?id=eq.1&select=*')
  if (!rows?.length) throw new Error('No token row in ml_tokens')
  const row = rows[0]
  // If token is still valid for >5 min, use it
  if (new Date(row.expires_at).getTime() - Date.now() > 5 * 60 * 1000) return row.access_token
  // Try to refresh
  const refreshRes = await fetch(ML_BASE + '/oauth/token', {
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

// ── ML Catalog-based search (works from Vercel!) ───────────────────────────
// Uses /products/search (catalog) + /products/CATALOG_ID/items (pricing/sellers)
// The deprecated /sites/MLB/search?q= returned 403 — these endpoints work fine.
async function searchByProductCatalog(query, mlToken) {
  const authParam = mlToken ? '&access_token=' + encodeURIComponent(mlToken) : ''

  // Step 1: Search ML product catalog by keyword (returns ~10k catalog entries)
  const searchUrl = ML_BASE + '/products/search?site_id=MLB&q=' + encodeURIComponent(query) +
                    '&limit=20' + authParam
  const searchRes = await fetch(searchUrl, { headers: { 'Accept': 'application/json' } })
  if (!searchRes.ok) throw new Error('/products/search -> ' + searchRes.status)
  const searchData = await searchRes.json()

  const catalogProducts = searchData.results || []
  if (!catalogProducts.length) return { results: [], total: 0 }

  const total = searchData.paging?.total || catalogProducts.length

  // Step 2: Fetch items (listings) for top 10 catalog products in parallel
  const top10 = catalogProducts.slice(0, 10)
  const itemsResults = await Promise.allSettled(
    top10.map(cp =>
      fetch(ML_BASE + '/products/' + cp.id + '/items?limit=100' + authParam, {
        headers: { 'Accept': 'application/json' }
      }).then(r => r.ok ? r.json() : null).catch(() => null)
    )
  )

  // Step 3: Combine catalog product info with items data
  const products = top10.map((cp, idx) => {
    const itemsData = itemsResults[idx].status === 'fulfilled' ? itemsResults[idx].value : null
    const items = itemsData?.items || itemsData?.results || []
    const itemCount = itemsData?.paging?.total || items.length

    // Price stats from items
    const prices = items.map(i => i.price).filter(p => p > 0)
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    const minPrice = prices.length ? Math.min(...prices) : 0
    const maxPrice = prices.length ? Math.max(...prices) : 0

    // Sellers
    const uniqueSellers = new Set(items.map(i => i.seller_id).filter(Boolean))

    // Shipping
    const freeShippingItems = items.filter(i => i.shipping?.free_shipping)
    const freeShippingPct = items.length ? freeShippingItems.length / items.length : 0

    // Official stores
    const hasOfficialStore = items.some(i => i.official_store_id)

    // Listing quality
    const goldItems = items.filter(i => i.listing_type_id?.startsWith('gold'))
    const goldPct = items.length ? goldItems.length / items.length : 0

    // Brand from attributes
    const brandAttr = cp.attributes?.find(a => a.id === 'BRAND')
    const brand = brandAttr?.value_name || ''

    return {
      // Catalog product info
      id: cp.id,
      catalog_product_id: cp.catalog_product_id || cp.id,
      title: cp.name || '',
      brand,
      domain_id: cp.domain_id || '',
      url: 'https://www.mercadolivre.com.br/p/' + cp.id,
      thumbnail: '',               // not available from /products/search; enriched later if needed

      // Market data from items
      price: Math.round(avgPrice * 100) / 100,
      min_price: minPrice,
      max_price: maxPrice,
      seller_count: uniqueSellers.size,  // number of competing sellers
      item_count: itemCount,             // total active listings
      free_shipping_pct: Math.round(freeShippingPct * 100),
      has_official_store: hasOfficialStore,
      gold_listing_pct: Math.round(goldPct * 100),
      condition: 'new',
      shipping_free: freeShippingPct > 0.5,

      // For frontend compatibility: use seller_count as proxy for competition
      sold: itemCount,  // total listings as proxy for demand signal
      seller: uniqueSellers.size + ' vendedores',
      rating: 0         // not available without read_reviews scope
    }
  })

  return { results: products, total }
}

// ── Main handler ───────────────────────────────────────────────────────────
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

  const SUPA_URL  = process.env.SUPABASE_URL
  const SUPA_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const APP_ID    = process.env.ML_APP_ID
  const APP_SECRET = process.env.ML_APP_SECRET || process.env.ML_SECRET_KEY

  // ── Auth: verify Supabase user token ────────────────────────────────────
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

  // ── Parse body ───────────────────────────────────────────────────────────
  let body
  try { body = await request.json() } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: cors })
  }
  const { query } = body
  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: 'Query required' }), { status: 400, headers: cors })
  }

  // ── Get ML token (for authenticated API calls) ───────────────────────────
  let mlToken = null
  try { mlToken = await getValidToken(SUPA_URL, SUPA_KEY, APP_ID, APP_SECRET) } catch (e) {
    console.warn('[ml] token fetch err:', e.message)
  }

  // ── Search via ML Product Catalog API ───────────────────────────────────
  let searchData
  try {
    searchData = await searchByProductCatalog(query.trim(), mlToken)
  } catch (e) {
    console.error('[ml-catalog] search error:', e.message)
    return new Response(JSON.stringify({ error: 'Falha ao buscar no catálogo ML: ' + e.message }), {
      status: 500, headers: cors
    })
  }

  const items = searchData.results || []

  // ── Build competitors list (frontend format) ─────────────────────────────
  const competitors = items.slice(0, 10).map(item => ({
    id: item.id,
    title: item.title,
    price: item.price,
    sold: item.item_count,       // total listings as demand proxy
    seller: item.seller,
    rating: item.rating,
    url: item.url,
    thumbnail: item.thumbnail,
    condition: item.condition,
    shipping_free: item.shipping_free,
    // Extra data for this approach
    seller_count: item.seller_count,
    min_price: item.min_price,
    max_price: item.max_price,
    brand: item.brand
  }))

  // ── Market stats ─────────────────────────────────────────────────────────
  const prices = items.map(i => i.price).filter(p => p > 0)
  const avgPrice = prices.length
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : 0

  // Use total catalog results as demand signal
  const totalCatalogResults = searchData.total || 0
  const avgItemCount = items.length
    ? Math.round(items.reduce((sum, i) => sum + i.item_count, 0) / items.length)
    : 0
  const totalListings = items.reduce((sum, i) => sum + i.item_count, 0)
  const totalSellers = items.reduce((sum, i) => sum + i.seller_count, 0)

  const topItem = items.reduce((top, item) =>
    (!top || item.item_count > top.item_count) ? item : top, null)

  // ── Opportunity score ────────────────────────────────────────────────────
  // Based on: demand (many results = active market), margin (price > 50), competition
  const hasHighDemand = totalCatalogResults > 1000 || totalListings > 500
  const hasGoodMargin = avgPrice > 50
  const hasHighCompetition = totalSellers > 500 || avgItemCount > 50
  const hasFreeShipping = items.some(i => i.shipping_free)

  let score = 45
  if (hasHighDemand) score += 20
  if (hasGoodMargin) score += 15
  if (!hasHighCompetition) score += 10
  if (hasFreeShipping) score += 10
  score = Math.min(100, Math.max(0, score))

  // ── Simulated demand chart ───────────────────────────────────────────────
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const base = Math.max(totalListings, 100) / 12
  const demandData = months.map(month => ({
    month,
    sales: Math.round(base * (0.7 + Math.random() * 0.6))
  }))

  const scoreDetails = {
    demand: hasHighDemand ? 'Alta demanda' : 'Demanda moderada',
    competition: hasHighCompetition ? 'Alta concorrência' : 'Baixa concorrência',
    margin: hasGoodMargin ? 'Margem boa' : 'Margem baixa',
    shipping: hasFreeShipping ? 'Frete grátis disponível' : 'Frete pago comum'
  }

  // ── Save search history ──────────────────────────────────────────────────
  try {
    await supaFetch(SUPA_URL, SUPA_KEY, 'POST', '/search_history', {
      user_id: userId,
      query: query.trim(),
      score,
      results: { competitors: competitors.length, avgPrice, totalSales: totalListings, totalCatalog: totalCatalogResults },
      category: items[0]?.domain_id || null
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
    totalSales: totalListings,
    topItem: topItem ? {
      title: topItem.title,
      price: topItem.price,
      sold: topItem.item_count,
      url: topItem.url
    } : null,
    query: query.trim(),
    total: totalCatalogResults,
    // Extra market stats
    market: {
      catalogResults: totalCatalogResults,
      avgListingsPerProduct: avgItemCount,
      totalActiveSellers: totalSellers
    }
  }), { headers: cors })
}
