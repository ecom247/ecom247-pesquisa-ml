import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ML_APP_ID = process.env.ML_APP_ID
const ML_SECRET_KEY = process.env.ML_SECRET_KEY
const ML_BASE = 'https://api.mercadolibre.com'

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function getValidToken() {
  const { data: row, error } = await adminSupabase
    .from('ml_tokens')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !row) throw new Error('Tokens ML não encontrados no banco de dados.')

  const expiresAt = new Date(row.expires_at).getTime()
  const now = Date.now()

  if (expiresAt - now < 10 * 60 * 1000) {
    console.log('[ml-search] Token expirando em breve, renovando...')
    return refreshToken(row.refresh_token)
  }

  return row.access_token
}

async function refreshToken(refreshToken) {
  const res = await fetch(`${ML_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: ML_APP_ID,
      client_secret: ML_SECRET_KEY,
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Falha ao renovar token ML: ${res.status} — ${txt}`)
  }

  const tokens = await res.json()
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await adminSupabase.from('ml_tokens').update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: newExpiresAt,
    updated_at: new Date().toISOString(),
  }).eq('id', 1)

  console.log('[ml-search] Token renovado com sucesso, expira em:', newExpiresAt)
  return tokens.access_token
}

async function mlFetch(path, token) {
  const res = await fetch(`${ML_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`ML API [${path}] → ${res.status}`)
  return res.json()
}

function calcScore(totalSales, numCompetitors, avgPrice, fullCount) {
  const demandScore = Math.min(40, Math.round((totalSales / 300) * 40))
  const fullRatio = numCompetitors > 0 ? fullCount / numCompetitors : 0
  const competitionScore = Math.max(0, Math.round(30 - fullRatio * 20 - (numCompetitors > 8 ? 10 : 0)))
  const priceScore = Math.min(30, Math.round((avgPrice / 500) * 30))
  const total = demandScore + competitionScore + priceScore
  return { demand: demandScore, competition: competitionScore, price: priceScore, total }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação necessário.' })
  }

  const jwt = authHeader.slice(7)
  const { data: { user }, error: authError } = await adminSupabase.auth.getUser(jwt)
  if (authError || !user) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' })
  }

  const { query } = req.body || {}
  if (!query?.trim()) {
    return res.status(400).json({ error: 'Informe o produto que deseja pesquisar.' })
  }

  try {
    const token = await getValidToken()

    const searchData = await mlFetch(
      `/sites/MLB/search?q=${encodeURIComponent(query.trim())}&limit=20&sort=sold_quantity_desc`,
      token
    )
    const items = searchData.results || []

    if (items.length === 0) {
      return res.status(200).json({
        query, score: 0, scoreDetails: { demand: 0, competition: 0, price: 0, total: 0 },
        competitors: [], demandData: [], totalSales: 0, avgPrice: 0, category: '',
        message: 'Nenhum resultado encontrado para essa busca.',
      })
    }

    const topItems = items.slice(0, 10)
    const itemResults = await Promise.allSettled(
      topItems.map(item => mlFetch(`/items/${item.id}`, token))
    )

    const sellerIds = [...new Set(topItems.map(i => i.seller?.id).filter(Boolean))].slice(0, 8)
    const sellerResults = await Promise.allSettled(
      sellerIds.map(id => mlFetch(`/users/${id}`, token))
    )
    const sellers = {}
    sellerResults.forEach(r => {
      if (r.status === 'fulfilled') sellers[r.value.id] = r.value
    })

    const REP_LABELS = {
      green_aa: 'Excelente', green: 'Muito Bom',
      yellow: 'Bom', orange: 'Regular', red: 'Péssimo',
    }

    const competitors = topItems.map((item, i) => {
      const detail = itemResults[i]?.status === 'fulfilled' ? itemResults[i].value : {}
      const seller = sellers[item.seller?.id] || {}
      const rep = seller.seller_reputation || {}
      const txn = rep.transactions || {}
      const positiveRatio = txn.ratings?.positive || 0
      const rating = parseFloat(Math.max(3.5, positiveRatio * 5).toFixed(1))
      const reputationLabel = REP_LABELS[rep.power_seller_status] || REP_LABELS[rep.level_id] || 'Bom'
      return {
        id: item.id,
        name: seller.nickname || item.seller?.nickname || `Vendedor ${i + 1}`,
        price: item.price,
        sales: detail.sold_quantity || item.sold_quantity || 0,
        rating,
        reputation: reputationLabel,
        shipping: detail.shipping?.logistic_type === 'fulfillment' ? 'Full' : 'Normal',
        visits: detail.health ?? 0,
        link: item.permalink,
        thumbnail: item.thumbnail,
        title: item.title,
      }
    })

    const totalSales = competitors.reduce((s, c) => s + c.sales, 0)
    const avgPrice = competitors.length > 0
      ? competitors.reduce((s, c) => s + c.price, 0) / competitors.length
      : 0
    const fullCount = competitors.filter(c => c.shipping === 'Full').length
    const scoreDetails = calcScore(totalSales, competitors.length, avgPrice, fullCount)
    const score = scoreDetails.total

    const SEASON = [
      { month: 'Out', f: 0.80 }, { month: 'Nov', f: 1.20 }, { month: 'Dez', f: 1.80 },
      { month: 'Jan', f: 0.70 }, { month: 'Fev', f: 0.80 }, { month: 'Mar', f: 0.90 },
    ]
    const base = Math.max(totalSales, 100)
    const demandData = SEASON.map(({ month, f }) => ({
      month,
      searches: Math.round(base * f * 4.2),
      sales: Math.round(base * f),
    }))

    let label, labelColor
    if (score >= 75) { label = '🔥 Alta Oportunidade'; labelColor = 'green' }
    else if (score >= 55) { label = '⚡ Boa Oportunidade'; labelColor = 'yellow' }
    else { label = '⚠️ Oportunidade Moderada'; labelColor = 'orange' }

    const result = {
      query, score,
      scoreDetails: { ...scoreDetails, label, labelColor },
      competitors, demandData, totalSales,
      avgPrice: parseFloat(avgPrice.toFixed(2)),
      category: items[0]?.category_id || '',
      topItem: {
        id: items[0]?.id,
        title: items[0]?.title,
        thumbnail: items[0]?.thumbnail,
        permalink: items[0]?.permalink,
      },
    }

    await adminSupabase.from('search_history').insert({
      user_id: user.id,
      query: query.trim(),
      results: result,
      score,
      category: result.category,
    })

    return res.status(200).json(result)

  } catch (err) {
    console.error('[ml-search] Error:', err.message)
    return res.status(500).json({ error: err.message || 'Erro interno ao buscar dados do ML.' })
  }
}
