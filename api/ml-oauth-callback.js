const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ML_APP_ID = process.env.ML_APP_ID || ''
const ML_APP_SECRET = process.env.ML_APP_SECRET || ''
const REDIRECT_URI = 'https://ecom247-pesquisa-ml.vercel.app/api/ml-oauth-callback'
const DASHBOARD_URL = 'https://ecom247-pesquisa-ml.vercel.app/dashboard'

export default async function handler(req, res) {
  const authCode = req.query?.code
  const error = req.query?.error

  if (error) {
    return res.redirect(302, DASHBOARD_URL + '?ml_error=' + encodeURIComponent(String(error)))
  }
  if (!authCode) {
    return res.status(400).json({ error: 'missing code' })
  }
  if (!ML_APP_ID || !ML_APP_SECRET) {
    return res.redirect(302, DASHBOARD_URL + '?ml_error=missing_app_credentials')
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.redirect(302, DASHBOARD_URL + '?ml_error=missing_supabase_credentials')
  }

  try {
    const params = new URLSearchParams()
    params.set('grant_type', 'authorization_code')
    params.set('client_id', ML_APP_ID)
    params.set('client_secret', ML_APP_SECRET)
    params.set('code', String(authCode))
    params.set('redirect_uri', REDIRECT_URI)

    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: params.toString()
    })
    const tokens = await tokenRes.json()

    if (!tokenRes.ok || !tokens.access_token) {
      console.error('ML token exchange failed:', JSON.stringify(tokens))
      return res.redirect(302, DASHBOARD_URL + '?ml_error=token_exchange_failed&detail=' + encodeURIComponent(tokens.message || tokens.error || ''))
    }

    const expiresAt = new Date(Date.now() + (tokens.expires_in || 21600) * 1000).toISOString()
    const dbRes = await fetch(SUPABASE_URL + '/rest/v1/ml_tokens', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: 1,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || '',
        user_id: String(tokens.user_id || ''),
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
    })

    if (!dbRes.ok) {
      const dbErr = await dbRes.text()
      console.error('DB error:', dbErr)
      return res.redirect(302, DASHBOARD_URL + '?ml_error=db_error&detail=' + encodeURIComponent(dbErr.substring(0, 100)))
    }

    return res.redirect(302, DASHBOARD_URL + '?ml_auth=success')
  } catch (err) {
    console.error('Unexpected error:', String(err))
    return res.redirect(302, DASHBOARD_URL + '?ml_error=unexpected&detail=' + encodeURIComponent(String(err.message || err)))
  }
}