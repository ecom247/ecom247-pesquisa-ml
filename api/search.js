export const config = { runtime: 'edge', regions: ['gru1'] }

const ML_API_BASE    = 'https://api.mercadolibre.com'

// ââ Supabase helper âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

// ââ Token management ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

// ââ Step 1: Get catalog product IDs from ML product search ââââââââââââââââââ
// /products/search returns catalog-level entries (no auth needed server-side)
async function getCatalogIds(query) {
  // Fetch a larger set to have more catalog IDs to check for active listings
  const url = ML_API_BASE + '/products/search?site_id=MLB&q=' +
              encodeURIComponent(query) + '&status=active&limit=50'
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) throw new Error('/products/search -> ' + res.status)
  const data = await res.json()
  const results = data.results || []
  const meta = {}
  results.forEach(p => {
    meta[p.id] = {
      title: p.name || '',
      brand: p.attributes?.find(a => a.id === 'BRAND')?.value_name || '',
      domain_id: p.domain_id || ''
    }
  })
  return {
    ids: results.map(p => p.id),
    meta,
    total: data.paging?.total || results.length
  }
}

// ââ Step 2: Fetch all PUBLIC marketplace listings for a catalog product ââââââ
// CRITICAL: Called WITHOUT auth token so ML returns ALL sellers' listings,
// not just the authenticated seller's own items (APP_USR token restriction).
async function getPublicCatalogItems(catalogId) {
  // No Authorization header â public endpoint returns all marketplace listings
  const res = await fetch(ML_API_BASE + '/products/' + catalogId + '/items?limit=50', {
    headers: { 'Accept': 'application/json' }
  })
  if (!res.ok) {
    console.warn('[ml-items] ' + catalogId + ' public -> ' + res.status)
    return null
  }
  return res.json()
}

// ââ Step 3: Fetch individual item details (price, seller, shipping) ââââââââââ
// When catalog items endpoint returns item IDs but not prices,
// fetch individual item details without auth.
async function getItemDetails(itemId) {
  const res = await fetch(ML_API_BASE + '/items/' + itemId + '?attributes=id,title,price,seller_id,shipping,listing_type_id,official_store_id,thumbnail', {
    headers: { 'Accept': 'application/json' }
  })
  if (!res.ok) return null
  return res.json()
}

// ââ Main handler ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

  // ââ Auth: verify Supabase user token ââââââââââââââââââââââââââââââââââââââ
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

  // ââ Parse body ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  let body
  try { body = await request.json() } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: cors })
  }
  const { query } = body
  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: 'Query required' }), { status: 400, headers: cors })
  }

  // ââ Refresh ML OAuth token (for save history only, NOT for item fetches) ââ
  try { await getValidToken(SUPA_URL, SUPA_KEY, APP_ID, APP_SECRET) } catch (e) {
    console.warn('[ml] token refresh err:', e.message)
  }

  // ââ Step 1: Get catalog IDs âââââââââââââââââââââââââââââââââââââââââââââââ
  let catalogSearch
  try {
    catalogSearch = await getCatalogIds(query.trim())
  } catch (e) {
    console.error('[ml-catalog] search error:', e.message)
    return new Response(JSON.stringify({ error: 'Falha ao buscar catÃ¡logo ML: ' + e.message }), {
      status: 500, headers: cors
    })
  }

  const { ids: catalogIds, meta: productMeta, total } = catalogSearch

  // Process top 30 catalog IDs to find those with active public listings
  const top30 = catalogIds.slice(0, 30)

  // ââ Step 2: Fetch PUBLIC items for each catalog product (NO auth) âââââââââ
  const itemsResults = await Promise.allSettled(
    top30.map(id => getPublicCatalogItems(id))
  )

  // ââ Step 3: Build product list from catalog + public items ââââââââââââââââ
  const allProducts = []

  for (let idx = 0; idx < top30.length; idx++) {
    const catalogId = top30[idx]
    const itemsData = itemsResults[idx].status === 'fulfilled' ? itemsResults[idx].value : null
    if (!itemsData) continue

    // Items endpoint can return data in different shapes
    let items = itemsData.results || itemsData.items || []
    const itemCount = itemsData.paging?.total || items.length

    // If items have no prices directly, try fetching item details
    // (some catalog item responses return item IDs without price data)
    if (items.length > 0 && !items[0].price && items[0].id) {
      const detailResults = await Promise.allSettled(
        items.slice(0, 10).map(i => getItemDetails(i.id))
      )
      items = detailResults
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value)
    }

    if (!items.length && itemCount === 0) continue

    const prices = items.map(i => i.price).filter(p => p > 0)
    if (prices.length === 0 && itemCount === 0) continue

    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    const minPrice = prices.length ? Math.min(...prices) : 0
    const maxPrice = prices.length ? Math.max(...prices) : 0

    const sellerSet = {}
    items.forEach(i => { if (i.seller_id) sellerSet[i.seller_id] = true })
    const sellerCount = Object.keys(sellerSet).length

    const freeShippingCount = items.filter(i => i.shipping?.free_shipping).length
    const freeShippingPct   = items.length ? freeShippingCount / items.length : 0
    const hasOfficialStore  = items.some(i => i.official_store_id)
    const goldCount         = items.filter(i => i.listing_type_id?.startsWith('gold')).length
    const goldPct           = items.length ? Math.round(goldCount / items.length * 100) : 0

    // Get thumbnail from first item that has one
    const thumbnail = items.find(i => i.thumbnail)?.thumbnail || ''

    const meta = productMeta[catalogId] || {}

    allProducts.push({
      id: catalogId,
      catalog_product_id: catalogId,
      title: meta.title || ('Produto ' + catalogId),
      thumbnail,
      url: 'https://www.mercadolivre.com.br/p/' + catalogId,
      rating: 0,
      reviews: 0,
      brand: meta.brand || '',

      price: Math.round(avgPrice * 100) / 100,
      min_price: minPrice,
      max_price: maxPrice,

      seller_count: sellerCount,
      item_count: itemCount,
      free_shipping_pct: Math.round(freeShippingPct * 100),
      has_official_store: hasOfficialStore,
      gold_listing_pct: goldPct,
      shipping_free: freeShippingPct > 0.5,
      condition: 'new',

      sold: itemCount,
      seller: sellerCount > 0 ? sellerCount + ' vendedores' : 'N/A'
    })
  }

  console.log('[v6] catalog IDs checked:', top30.length, 'with active listings:', allProducts.length)

  // ââ Build competitors list ââââââââââââââââââââââââââââââââââââââââââââââââ
  // Sort by item_count descending (most active products first)
  allProducts.sort((a, b) => b.item_count - a.item_count)

  const displayProducts = allProducts.length ? allProducts : []

  const competitors = displayProducts.slice(0, 10).map(p => ({
    id:            p.id,
    title:         p.title,
    price:         p.price,
    sold:          p.sold,
    seller:        p.seller,
    rating:        p.rating,
    url:           p.url,
    thumbnail:     p.thumbnail,
    condition:     p.condition,
    shipping_free: p.shipping_free,
    seller_count:  p.seller_count,
    min_price:     p.min_price,
    max_price:     p.max_price,
    brand:         p.brand
  }))

  // ââ Market stats ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const priceList      = displayProducts.map(p => p.price).filter(p => p > 0)
  const avgPrice       = priceList.length
    ? Math.round(priceList.reduce((a, b) => a + b, 0) / priceList.length)
    : 0
  const totalListings  = displayProducts.reduce((s, p) => s + p.item_count, 0)
  const totalSellers   = displayProducts.reduce((s, p) => s + p.seller_count, 0)
  const avgItemCount   = displayProducts.length ? Math.round(totalListings / displayProducts.length) : 0

  const topItem = displayProducts.reduce((top, p) =>
    (!top || p.item_count > top.item_count) ? p : top, null)

  // ââ Opportunity score âââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const hasHighDemand    = total > 1000 || totalListings > 500
  const hasGoodMargin    = avgPrice > 50
  const hasHighComp      = totalSellers > 500 || avgItemCount > 50
  const hasFreeShipping  = displayProducts.some(p => p.shipping_free)

  let score = 45
  if (hasHighDemand)   score += 20
  if (hasGoodMargin)   score += 15
  if (!hasHighComp)    score += 10
  if (hasFreeShipping) score += 10
  score = Math.min(100, Math.max(0, score))

  // ââ Demand chart (estimated) ââââââââââââââââââââââââââââââââââââââââââââââ
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const base = Math.max(totalListings, 100) / 12
  const demandData = months.map(month => ({
    month,
    sales: Math.round(base * (0.7 + Math.random() * 0.6))
  }))

  const scoreDetails = {
    demand:      hasHighDemand   ? 'Alta demanda'       : 'Demanda moderada',
    competition: hasHighComp     ? 'Alta concorrÃªncia'  : 'Baixa concorrÃªncia',
    margin:      hasGoodMargin   ? 'Margem boa'         : 'Margem baixa',
    shipping:    hasFreeShipping ? 'Frete grÃ¡tis disponÃ­vel' : 'Frete pago comum'
  }

  // ââ Save search history âââââââââââââââââââââââââââââââââââââââââââââââââââ
  try {
    await supaFetch(SUPA_URL, SUPA_KEY, 'POST', '/search_history', {
      user_id:  userId,
      query:    query.trim(),
      score,
      results:  { competitors: competitors.length, avgPrice, totalSales: totalListings, total },
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
    totalSales: totalListings,
    topItem: topItem ? {
      title: topItem.title,
      price: topItem.price,
      sold:  topItem.item_count,
      url:   topItem.url
    } : null,
    query: query.trim(),
    total,
    searchMode: 'catalog-public',
    market: {
      catalogResults:        total,
      avgListingsPerProduct: avgItemCount,
      totalActiveSellers:    totalSellers,
      catalogChecked:        top30.length,
      catalogWithListings:   allProducts.length
    }
  }), { headers: cors })
}
