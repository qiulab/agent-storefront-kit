import * as cheerio from 'cheerio';
import type { Audit, Product, Signal } from '../shared/storefront';
import { readiness } from '../shared/storefront';
import { publicFetch } from './publicFetch';

export function scoreProducts(products: Product[], text: string, source: string): Signal[] {
  const all = (fn: (p: Product) => boolean) => products.length > 0 && products.every(fn);
  const checks: [Signal['key'],string,boolean,string,string][] = [
    ['pricing','Price + currency',all(p => p.price !== null && /^[A-Z]{3}$/.test(p.currency)),`${products.filter(p=>p.price!==null && p.currency).length}/${products.length} products have price and currency.`, 'Publish a numeric price and ISO currency for each product or variant.'],
    ['stock','Availability',all(p=>p.available!==null),`${products.filter(p=>p.available!==null).length}/${products.length} products expose a stock state.`, 'Add offers.availability: InStock or OutOfStock in product JSON-LD.'],
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
  if (!data.products.length) throw new Error(data.malformed ? 'Malformed Product JSON-LD found. Fix the structured data or try another product page.' : 'No Product JSON-LD found. This may be a JavaScript-only or unsupported storefront. Try a public product detail page.');
  const signals = scoreProducts(data.products,data.text,'Public HTML · sampled page');
  return { id: crypto.randomUUID(), url:response.url, name:data.name, scannedAt:new Date().toISOString(), demo:false, products:data.products, signals, score:readiness(signals), rawText:data.text, trace:[{tool:'fetch_storefront',detail:`HTTP ${response.status}; fetched public HTML without executing JavaScript.`,status:'complete'},{tool:'extract_product_schema',detail:`${data.products.length} Product JSON-LD entries normalized. Audit covers this page, not the full catalog.`,status:'complete'},{tool:'inspect_commerce_policies',detail:'Checked page text and policy links. Link discovery does not guarantee policy completeness.',status:'complete'},{tool:'score_readiness',detail:`${signals.filter(s=>s.score===100).length}/8 deterministic checks passed.`,status:'complete'}] };
}
