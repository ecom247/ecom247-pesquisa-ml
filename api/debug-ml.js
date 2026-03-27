export const config = { runtime: 'edge', regions: ['gru1'] }

export default async function handler(request) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || 'telefone';
  const slug = query.trim().replace(/\s+/g, '-');
  const mlUrl = 'https://lista.mercadolivre.com.br/' + encodeURIComponent(slug);
  try {
    const res = await fetch(mlUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      },
      redirect: 'follow'
    });
    const html = await res.text();
    const hasLdJson = html.includes('application/ld+json');
    const hasProduct = html.includes('"@type":"Product"');
    const hasNordic = html.includes('__NORDIC_RENDERING_CTX__');
    const ldCount = (html.match(/<script[^>]+type="application\/ld\+json"/g) || []).length;
    return new Response(JSON.stringify({
      fetchUrl: mlUrl, status: res.status, finalUrl: res.url,
      htmlLength: html.length, hasLdJson, hasProduct, hasNordic, ldScriptCount: ldCount,
      htmlStart: html.slice(0, 400), htmlEnd: html.slice(-200)
    }), { headers: cors });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message, url: mlUrl }), { headers: cors });
  }
}