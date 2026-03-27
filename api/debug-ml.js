export const config = { runtime: 'edge', regions: ['gru1'] }

export default async function handler(request) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || 'telefone';
  const token = url.searchParams.get('token') || '';
  
  const tests = {};
  
  // Test 1: products/search
  try {
    const r1 = await fetch('https://api.mercadolibre.com/products/search?site_id=MLB&q=' + encodeURIComponent(query) + '&limit=5' + (token ? '&access_token=' + token : ''), {
      headers: { 'Accept': 'application/json' }
    });
    const d1 = await r1.json();
    tests.products_search = { status: r1.status, total: d1.paging?.total, count: d1.results?.length, first_id: d1.results?.[0]?.id };
  } catch(e) { tests.products_search = { error: e.message }; }
  
  // Test 2: products/CATALOG_ID/items
  if (tests.products_search.first_id) {
    try {
      const r2 = await fetch('https://api.mercadolibre.com/products/' + tests.products_search.first_id + '/items?limit=5' + (token ? '&access_token=' + token : ''));
      const d2 = await r2.json();
      tests.catalog_items = { status: r2.status, total: d2.paging?.total, first_price: d2.results?.[0]?.price, first_seller: d2.results?.[0]?.seller_id };
    } catch(e) { tests.catalog_items = { error: e.message }; }
  }
  
  // Test 3: products/CATALOG_ID detail
  if (tests.products_search.first_id) {
    try {
      const r3 = await fetch('https://api.mercadolibre.com/products/' + tests.products_search.first_id + '?access_token=' + token);
      const d3 = await r3.json();
      tests.catalog_detail = { status: r3.status, name: d3.name?.slice(0,60), main_image: d3.main_image?.id, pictures_count: d3.pictures?.length };
    } catch(e) { tests.catalog_detail = { error: e.message }; }
  }
  
  return new Response(JSON.stringify(tests, null, 2), { headers: cors });
}