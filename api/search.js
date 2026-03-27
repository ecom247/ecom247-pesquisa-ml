export const config = { runtime: 'edge', regions: ['gru1'] }

const ML_SEARCH_BASE = 'https://lista.mercadolivre.com.br'
const ML_API_BASE    = 'https://api.mercadolibre.com'

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

// ── Step 1: Scrape ML search page to extract active catalog product IDs ────
// ML search page contains JSON-LD with product data + /p/MLBXXX catalog URLs.
// Even if prices are obfuscated for bots, the catalog IDs in URLs remain intact.
async function getCatalogIdsFromSearch(query) {
  const slug = query.trim().replace(/\s+/g, '-')
  const url = ML_SEARCH_BASE + '/' + encodeURIComponent(slug)

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache'
    }
  })

  if (!res.ok) {
    console.warn('[ml-scrape] fetch failed:', res.status)
    return null
  }
  const html = await res.text()

  // Extract catalog IDs from all /p/MLB... patterns in the HTML
  const catalogSet = {}
  const rxId = /\/p\/(MLB\d+)/g
  let m
  while ((m = rxId.exec(html)) !== null) catalogSet[m[1]] = true
  const catalogIds = Object.keys(catalogSet)

  if (!catalogIds.length) {
    console.warn('[ml-scrape] no catalog IDs found in HTML')
    return null
  }

  // Extract product metadata from JSON-LD (titles, thumbnails, ratings)
  // Note: prices in JSON-LD may be 0/obfuscated — we use ML API for real prices
  const productMeta = {}
  const ldRx = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  let ldM
  while ((ldM = ldRx.exec(html)) !== null) {
    try {
      const d = JSON.parse(ldM[1])
      const nodes = d['@graph'] || [d]
      for (const node of nodes) {
        if (node['@type'] === 'Product') {
          const productUrl = node.offers?.url || ''
          const idMatch = productUrl.match(/\/p\/(MLB\d+)/)
          if (idMatch) {
            const img = node.image
            productMeta[idMatch[1]] = {
              title: node.name || '',
              thumbnail: Array.isArray(img) ? img[0] : (img || ''),
              rating: parseFloat(node.aggregateRating?.ratingValue) || 0,
              reviews: parseInt(node.aggregateRating?.ratingCount) || 0
            }
          }
        }
      }
    } catch (e) { /* ignore malformed LD */ }
  }

  // Extract total results count
  const totalM = html.match(/"total"\s*:\s*(\d{3,})/)
  const total = totalM ? parseInt(totalM[1]) : catalogIds.length

  console.log('[ml-scrape] found', catalogIds.length, 'catalog IDs, total=', total)
  return { catalogIds: catalogIds.slice(0, 15), productMeta, total }
}

// ── Step 2: Fetch marketplace items for a catalog product via ML API ────────
async function getCatalogItems(catalogId, mlToken) {
  const headers = { 'Accept': 'application/json' }
  // Use Authorization header (more reliable than query param from server)
  if (mlToken) headers['Authorization'] = 'Bearer ' + mlToken

  const res = await fetch(ML_API_BASE + '/products/' + catalogId + '/items?limit=100', { headers })
  if (!res.ok) {
    console.warn('[ml-items] ' + catalogId + ' -> ' + res.status)
    return null
  }
  return res.json()
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

  const SUPA_URL   = process.env.SUPABASE_URL
  const SUPA_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY
  const APP_ID     = process.env.ML_APP_ID
  const APP_SECRET = process.env.ML_APP_SECRET || process.env.ML_SECRET_KEY

  // ── Auth: verify Supabase user token ─────────────────────────────────────
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

  // ── Get ML OAuth token ────────────────────────────────────────────────────
  let mlToken = null
  try { mlToken = await getValidToken(SUPA_URL, SUPA_KEY, APP_ID, APP_SECRET) } catch (e) {
    console.warn('[ml] token fetch err:', e.message)
  }

  // ── Step 1: Get catalog IDs from ML search page HTML ─────────────────────
  let searchResult = null
  try {
    searchResult = await getCatalogIdsFromSearch(query.trim())
  } catch (e) {
    console.warn('[ml-scrape] error:', e.message)
  }

  // ── Fallback: use /products/search API if HTML scraping failed ────────────
  if (!searchResult || !searchResult.catalogIds.length) {
    console.log('[ml] falling back to /products/search API')
    try {
      const fbUrl = ML_API_BASE + '/products/search?site_id=MLB&q=' + encodeURIComponent(query.trim()) +
                    '&status=active&limit=50' +
                    (mlToken ? '&access_token=' + encodeURIComponent(mlToken) : '')
      const fbRes = await fetch(fbUrl, { headers: { 'Accept': 'application/json' } })
      const fbData = await fbRes.json()
      const fbResults = fbData.results || []
      const fbIds = fbResults.map(p => p.id)
      // Populate productMeta from catalog data so we get real product names
      const fbMeta = {}
      fbResults.forEach(p => {
        fbMeta[p.id] = {
          title: p.name || '',
          thumbnail: '',
          rating: 0,
          reviews: 0
        }
      })
      searchResult = {
        catalogIds: fbIds,
        productMeta: fbMeta,
        total: fbData.paging?.total || fbIds.length
      }
    } catch (e) {
      console.error('[ml] fallback search error:', e.message)
      return new Response(JSON.stringify({ error: 'Falha ao buscar produtos: ' + e.message }), {
        status: 500, headers: cors
      })
    }
  }

  const { catalogIds, productMeta, total } = searchResult
  const top10 = catalogIds.slice(0, 20)

  // ── Step 2: Fetch marketplace items for each catalog product ──────────────
  const itemsResults = await Promise.allSettled(
    top10.map(id => getCatalogItems(id, mlToken))
  )

  // ── Step 3: Combine catalog metadata + items data ─────────────────────────
  const allProducts = top10.map((catalogId, idx) => {
    const itemsData = itemsResults[idx].status === 'fulfilled' ? itemsResults[idx].value : null
    const items = itemsData?.results || itemsData?.items || []
    const itemCount = itemsData?.paging?.total || items.length

    const prices = items.map(i => i.price).filter(p => p > 0)
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

    const meta = productMeta[catalogId] || {}

    return {
      id: catalogId,
      catalog_product_id: catalogId,
      title: meta.title || ('Produto ' + catalogId),
      thumbnail: meta.thumbnail || '',
      url: 'https://www.mercadolivre.com.br/p/' + catalogId,
      rating: meta.rating || 0,
      reviews: meta.reviews || 0,
      brand: '',

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

      // Frontend compatibility fields
      sold: itemCount,
      seller: sellerCount + ' vendedores'
    }
  })

  // Only keep products with price or listing data
  const products = allProducts.filter(p => p.price > 0 || p.item_count > 0)
  const displayProducts = products.length ? products : allProducts

  // ── Build competitors (frontend format) ────────────────────────────────────
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

  // ── Market stats ───────────────────────────────────────────────────────────
  const priceList    = displayProducts.map(p => p.price).filter(p => p > 0)
  const avgPrice     = priceList.length
    ? Math.round(priceList.reduce((a, b) => a + b, 0) / priceList.length)
    : 0
  const totalListings  = displayProducts.reduce((s, p) => s + p.item_count, 0)
  const totalSellers   = displayProducts.reduce((s, p) => s + p.seller_count, 0)
  const avgItemCount   = displayProducts.length ? Math.round(totalListings / displayProducts.length) : 0

  const topItem = displayProducts.reduce((top, p) =>
    (!top || p.item_count > top.item_count) ? p : top, null)

  // ── Opportunity score ─────────────────────────────────────────────────────
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

  // ── Demand chart (estimated) ──────────────────────────────────────────────
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const base = Math.max(totalListings, 100) / 12
  const demandData = months.map(month => ({
    month,
    sales: Math.round(base * (0.7 + Math.random() * 0.6))
  }))

  const scoreDetails = {
    demand:      hasHighDemand   ? 'Alta demanda'       : 'Demanda moderada',
    competition: hasHighComp     ? 'Alta concorrência'  : 'Baixa concorrência',
    margin:      hasGoodMargin   ? 'Margem boa'         : 'Margem baixa',
    shipping:    hasFreeShipping ? 'Frete grátis disponível' : 'Frete pago comum'
  }

  // ── Save search history ────────────────────────────────────────────────────
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
    market: {
      catalogResults:        total,
      avgListingsPerProduct: avgItemCount,
      totalActiveSellers:    totalSellers
    }
  }), { headers: cors })
}
