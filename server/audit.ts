import * as cheerio from 'cheerio';
import type { Audit, Product, Signal } from '../shared/storefront.js';
import { readiness } from '../shared/storefront.js';
import { publicFetch } from './publicFetch.js';

export function scoreProducts(products: Product[], text: string, source: string): Signal[] {
  const all = (fn: (p: Product) => boolean) => products.length > 0 && products.every(fn);
  const checks: [Signal['key'],string,boolean,string,string][] = [
    ['pricing','Price + currency',all(p => p.price !== null && /^[A-Z]{3}$/.test(p.currency)),`${products.filter(p=>p.price!==null && p.currency).length}/${products.length} products have price and currency.`, 'Publish a numeric price and ISO currency for each product or variant.'],
    ['stock','Stock evidence',all(p=>p.available!==null),`${products.filter(p=>p.available!==null).length}/${products.length} products have an observed stock label: ${products.filter(p=>p.available===true).length} in stock, ${products.filter(p=>p.available===false).length} sold out, ${products.filter(p=>p.available===null).length} unknown. Sold out counts as known, not missing.`, 'Expose stock per product in clearly labeled public cards or machine-readable data. Unknown does not mean out of stock or invisible to every agent.'],
    ['image','Product images',all(p=>!!p.image),`${products.filter(p=>p.image).length}/${products.length} products include a primary image.`, 'Add a publicly accessible primary image URL.'],
    ['description','Descriptions',all(p=>(p.description?.length||0)>=40),`${products.filter(p=>(p.description?.length||0)>=40).length}/${products.length} descriptions contain at least 40 characters.`, 'Describe materials, use case, and differentiators in at least 40 characters.'],
    ['shipping','Shipping policy',/\b(shipping|delivery)\b.{0,120}(\b\d+\b|free|policy|business days)|shipping policy/i.test(text),'Shipping policy or delivery terms '+(/\b(shipping|delivery)\b.{0,120}(\b\d+\b|free|policy|business days)|shipping policy/i.test(text)?'discovered.':'not found.'),'Publish and link shipping costs, regions, and delivery terms.'],
    ['returns','Returns policy',/\b(return|refund)s?\b.{0,120}(\b\d+\b|policy|days)|refund policy/i.test(text),'Return or refund policy '+(/\b(return|refund)s?\b.{0,120}(\b\d+\b|policy|days)|refund policy/i.test(text)?'discovered.':'not found.'),'Publish a return window, conditions, and a linked refund policy.'],
    ['variants','Variant labels',all(p=>!!p.variants?.length && p.variants.every(v=>!!v.trim()) && new Set(p.variants).size===p.variants.length), 'Check distinct variant labels. Single-option products are labeled explicitly.', 'Expose distinct size, color, or option labels for every returned variant.'],
    ['contact','Contact & support',/contact|support@|mailto:|customer service|help center/i.test(text),'Contact or support path '+(/contact|support@|mailto:|customer service|help center/i.test(text)?'found.':'not found.'),'Link a contact page, support email, or help center.']
  ];
  return checks.map(([key,label,passed,evidence,fix])=>({key,label,score:passed?100:0,evidence,source,fix}));
}
export function extractHTML(html: string, url: string): { products: Product[]; text: string; name: string; malformed: boolean } {
  const $ = cheerio.load(html); const products: Product[] = []; let malformed = false;
  function walk(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
    if (types.includes('Product') && obj.name) {
      const offer = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers || {};
      const value = offer.price ?? offer.lowPrice;
      const availability = String(offer.availability || '');
      const image = Array.isArray(obj.image) ? obj.image[0] : obj.image;
      const variant = obj.hasVariant ? (Array.isArray(obj.hasVariant)?obj.hasVariant:[obj.hasVariant]).map((v:any)=>String(v.name||v.sku||'')) : [String(obj.size||obj.color||'Single option')];
      products.push({ id: String(obj.sku || obj.productID || `product-${products.length}`), title: String(obj.name), description: typeof obj.description==='string'?cheerio.load(obj.description).text():undefined, variants:variant, price: value !== undefined && Number.isFinite(Number(value)) ? Number(value) : null, currency: offer.priceCurrency || '', available: /OutOfStock|SoldOut|Discontinued/.test(availability) ? false : /InStock|LimitedAvailability|PreOrder/.test(availability) ? true : null, image: typeof image==='string'?new URL(image,url).href:undefined, url: new URL(obj.url||offer.url||url,url).href, source:'Product JSON-LD' });
    }
    Object.values(obj).forEach(walk);
  }
  $('script[type="application/ld+json"]').each((_i,el)=>{try {walk(JSON.parse($(el).text()));} catch {malformed=true;} });
  if(!products.length) {
    const currency=$('meta[property="product:price:currency"],meta[itemprop="priceCurrency"]').first().attr('content')||html.match(/"selectedCurrency"\s*:\s*"([A-Z]{3})"/)?.[1]||html.match(/"defaultCurrency"\s*:\s*"([A-Z]{3})"/)?.[1]||'';
    $('.product-block-content,.product-list-item,.ProductList-item,li.product,[itemtype$="/Product"]').each((i,el)=>{
      const card=$(el);const titleElement=card.find('.product-title,.ProductList-title,.product-list-item-title,.woocommerce-loop-product__title,[itemprop="name"]').first();
      const title=titleElement.text().replace(/\s+/g,' ').trim();
      const link=titleElement.attr('href')||titleElement.closest('a').attr('href')||card.find('a[href]').first().attr('href');
      const priceElement=card.find('.sale-price,.price ins,[itemprop="price"],.product-price,.product-list-item-price,.price').first();
      const priceText=priceElement.attr('content')||priceElement.text();const amount=priceText.replace(/,/g,'').match(/\d+(?:\.\d{1,2})?/);
      if(!title||!link||!amount)return;
      const image=card.find('img').first();const imageUrl=image.attr('data-src')||image.attr('data-image')||image.attr('src');
      const status=card.find('.product-status,.sold-out,.out-of-stock,[itemprop="availability"]').text()+' '+(card.find('[itemprop="availability"]').attr('href')||'');
      const description=card.find('.product-excerpt,[itemprop="description"],.woocommerce-product-details__short-description').first().text().replace(/\s+/g,' ').trim();
      const variants=card.find('select option').map((_i,o)=>$(o).text().trim()).get().filter(v=>v&&!/^(choose|select)/i.test(v));
      products.push({id:card.attr('data-item-id')||card.attr('data-product-id')||`html-product-${i}`,title,description:description||undefined,price:Number(amount[0]),currency,available:/sold.?out|out.?of.?stock|OutOfStock/i.test(status)?false:/InStock/.test(status)?true:null,variants,image:imageUrl?new URL(imageUrl,url).href:undefined,url:new URL(link,url).href,source:html.includes('squarespace')?'Squarespace public product card':'Public HTML product card'});
    });
  }
  $('script,style,noscript,svg,nav').remove();
  const links = $('a').map((_i,el)=>`${$(el).text()} ${$(el).attr('href')||''}`).get().join('\n');
  const text = $('body').text().replace(/\s+/g,' ').trim()+'\n'+links;
  const name = $('meta[property="og:site_name"]').attr('content') || $('title').text().split(/[|–]/)[0].trim() || new URL(url).hostname;
  return { products: Array.from(new Map(products.map(p=>[p.url+'|'+p.title,p])).values()).slice(0,24), text:text.slice(0,24000), name, malformed };
}
export async function analyzeStore(input: string): Promise<Audit> {
  const response = await publicFetch(input);
  if (response.status === 401 || response.status === 403 || response.status === 429) throw new Error(`Storefront blocked the audit (HTTP ${response.status}). Try a public product page.`);
  if (response.status >= 400) throw new Error(`Storefront returned HTTP ${response.status}. Check the URL.`);
  const data = extractHTML(response.text,response.url);
  const discovery:Audit['trace']=[];
  if(!data.products.length) {
    const $=cheerio.load(response.text);const origin=new URL(response.url).origin;
    const links=Array.from(new Set($('a[href]').map((_i,a)=>{try {const u=new URL($(a).attr('href')!,response.url);return u.origin===origin&&/\/(?:products?|p)\//i.test(u.pathname)?u.href:'';}catch{return '';}}).get().filter(Boolean))).slice(0,2);
    const pages=await Promise.all(links.map(async link=>{try {const r=await publicFetch(link);return r.status<400?extractHTML(r.text,r.url):null;}catch{return null;}}));
    const found=pages.flatMap(p=>p?.products||[]);data.products=Array.from(new Map(found.map(p=>[p.url+'|'+p.title,p])).values()).slice(0,24);data.text=(data.text+'\n'+pages.map(p=>p?.text||'').join('\n')).slice(0,40000);
    if(links.length)discovery.push({tool:'discover_product_pages',detail:`No product facts on the first page. Followed ${links.length} same-store product links; found ${data.products.length} products.`,status:data.products.length?'complete':'warning'});
  }
  const source=data.products.some(p=>p.source.includes('product card'))?'Public HTML · product cards':'Public HTML · sampled page';
  const signals = scoreProducts(data.products,data.text,source);
  return { id: crypto.randomUUID(), url:response.url, name:data.name, scannedAt:new Date().toISOString(), demo:false, products:data.products, signals, score:readiness(signals), rawText:data.text, trace:[{tool:'fetch_storefront',detail:`HTTP ${response.status}; fetched public HTML without executing JavaScript.`,status:'complete'},...discovery,{tool:'extract_product_facts',detail:data.products.length?`${data.products.length} retrieved products normalized from ${source}. Coverage is sampled, not the full catalog.`:'No product schema or supported product cards exposed. Product-level checks remain failed; try a product-detail URL or Shop MCP. No facts invented.',status:data.products.length?'complete':'warning'},{tool:'inspect_commerce_policies',detail:'Checked page text and policy links. Link discovery does not guarantee policy completeness.',status:'complete'},{tool:'score_readiness',detail:`${signals.filter(s=>s.score===100).length}/8 deterministic checks passed.`,status:'complete'}] };
}
