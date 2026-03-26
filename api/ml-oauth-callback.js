const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ML_APP_ID = process.env.ML_APP_ID
const ML_APP_SECRET = process.env.ML_APP_SECRET
const REDIRECT_URI = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/ml-oauth-callback`
  : 'https://ecom247-pesquisa-ml.vercel.app/api/ml-oauth-callback'
const DASHBOARD_URL = 'https://ecom247-pesquisa-ml.vercel.app/dashboard'

module.exports = async function handler(req, res) {
  const { code: authCode, error } = req.query

  if (error) {
    return res.redirect(302, DASHBOARD_URL + '?ml_error=' + encodeURIComponent(error))
  }
  if (!authCode) {
    return res.status(400).json({ error: 'missing code' })
  }

  try {
    const params = new URLSearchParams()
    params.set('grant_type', 'authorization_code')
    params.set('client_id', ML_APP_ID)
    params.set('client_secret', ML_APP_SECRET)
    params.set('code', authCode)
    params.set('redirect_uri', 'https://ecom247-pesquisa-ml.vercel.app/api/ml-oauth-callback')

    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    })

    const tokens = await tokenRes.json()

    if (!tokenRes.ok || !tokens.access_token) {
      console.error('Token exchange failed:', JSON.stringify(tokens))
      return res.redirect(302, DASHBOARD_URL + '?ml_error=token_exchange_failed')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { error: dbError } = await supabase.from('ml_tokens').upsert({
      id: 1,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      user_id: String(tokens.user_id || ''),
      expires_at: new Date(Date.now() + (tokens.expires_in || 21600) * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })

    if (dbError) {
      console.error('DB error:', JSON.stringify(dbError))
      return res.redirect(302, DASHBOARD_URL + '?ml_error=db_error')
    }

    return res.redirect(302, DASHBOARD_URL + '?ml_auth=success')
  } catch (err) {
    console.error('Unexpected error:', err)
    return res.redirect(302, DASHBOARD_URL + '?ml_error=unexpected')
  }
}