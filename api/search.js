export const config = { runtime: 'edge', regions: ['gru1'] }

const ML_SEARCH_BASE = 'https://lista.mercadolivre.com.br'

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

function parseSoldText(altText) {
  if (!altText) return 0
  const m = altText.match(/Mais de (\d+)(mil)?/i)
  if (!m) return 0
  const n = parseInt(m[1])
  return m[2] ? n * 1000 : n
}

async function scrapeMLProducts(query) {
  const slug = query.trim().replace(/\s+/g, '-')
  const url = ML_SEARCH_BASE + '/' + encodeURIComponent(slug)

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  })

  if (!res.ok) throw new Error('ML scrape failed: ' + res.status)
  const html = await res.text()

  // 1. Extract products from JSON-LD
  const products = []
  const ldRx = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  let ldM
  while ((ldM = ldRx.exec(html)) !== null) {
    try {
      const d = JSON.parse(ldM[1])
      const nodes = d['@graph'] || [d]
      for (const node of nodes) {
        if (node['@type'] === 'Product') {
          const imgRaw = node.image
          products.push({
            title: node.name || '',
            brand: node.brand?.name || '',
            price: parseFloat(node.offers?.price) || 0,
            rating: parseFloat(node.aggregateRating?.ratingValue) || 0,
            reviews: parseInt(node.aggregateRating?.ratingCount) || 0,
            url: node.offers?.url || '',
            thumbnail: Array.isArray(imgRaw) ? imgRaw[0] : (imgRaw || ''),
            sold_quantity: 0,
            seller: 'N/A',
            condition: 'new',
            shipping_free: false
          })
        }
      }
    } catch (e) {}
  }

  // 2. Extract sold quantities from __NORDIC_RENDERING_CTX__ alt_text
  const soldRx = /"alt_text":"[^"]*?Mais de (\d+)(mil)? produtos vendidos[^"]*"/g
  const soldValues = []
  let sM
  while ((sM = soldRx.exec(html)) !== null) {
    const n = parseInt(sM[1])
    soldValues.push(sM[2] ? n * 1000 : n)
  }
  products.forEach((p, i) => {
    if (i < soldValues.length) p.sold_quantity = soldValues[i]
  })

  // 3. Extract total count
  const totalM = html.match(/"total"\s*:\s*(\d{3,})/)
  const total = totalM ? parseInt(totalM[1]) : products.length

  return { results: products, total }
}

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

  const SUPA_URL = process.env.SUPABASE_URL
  const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

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
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Unauthorized: ' + e.message }), { status: 401, headers: cors })
  }

  let body
  try { body = await request.json() } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: cors })
  }

  const { query } = body
  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: 'Query required' }), { status: 400, headers: cors })
  }

  let searchData
  try {
    searchData = await scrapeMLProducts(query)
  } catch (e) {
    console.error('[ml-scrape] Error:', e.message)
    return new Response(JSON.stringify({ error: 'Falha ao buscar dados do ML: ' + e.message }), { status: 500, headers: cors })
  }

  const items = searchData.results || []

  const competitors = items.slice(0, 10).map(item => {
    const idM = item.url.match(/\/(MLB\w+)/)
    return {
      id: idM ? idM[1] : '',
      title: item.title,
      price: item.price,
      sold: item.sold_quantity,
      seller: item.seller,
      rating: item.rating,
      url: item.url,
      thumbnail: item.thumbnail,
      condition: item.condition,
      shipping_free: item.shipping_free
    }
  })

  const prices = items.map(i => i.price).filter(p => p > 0)
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0
  const totalSales = items.reduce((sum, i) => sum + (i.sold_quantity || 0), 0)
  const topItem = items.reduce((top, item) =>
    (!top || (item.sold_quantity || 0) > (top.sold_quantity || 0)) ? item : top, null)

  const hasHighDemand = totalSales > 500 || items.some(i => (i.sold_quantity || 0) > 1000)
  const hasCompetition = items.length >= 10
  const hasGoodMargin = avgPrice > 50
  const freePct = items.filter(i => i.shipping_free).length / Math.max(items.length, 1)

  let score = 45
  if (hasHighDemand) score += 20
  if (hasGoodMargin) score += 15
  if (!hasCompetition) score += 10
  if (freePct > 0.5) score += 10
  score = Math.min(100, Math.max(0, score))

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const base = Math.max(totalSales, 100) / 12
  const demandData = months.map(month => ({
    month,
    sales: Math.round(base * (0.7 + Math.random() * 0.6))
  }))

  const scoreDetails = {
    demand: hasHighDemand ? 'Alta demanda' : 'Demanda moderada',
    competition: hasCompetition ? 'Alta concorrência' : 'Baixa concorrência',
    margin: hasGoodMargin ? 'Margem boa' : 'Margem baixa',
    shipping: freePct > 0.5 ? 'Frete grátis dominante' : 'Frete pago comum'
  }

  try {
    await supaFetch(SUPA_URL, SUPA_KEY, 'POST', '/search_history', {
      user_id: userId,
      query: query.trim(),
      score,
      results: { competitors: competitors.length, avgPrice, totalSales },
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
    totalSales,
    topItem: topItem ? {
      title: topItem.title,
      price: topItem.price,
      sold: topItem.sold_quantity,
      url: topItem.url
    } : null,
    query: query.trim(),
    total: searchData.total
  }), { headers: cors })
}
