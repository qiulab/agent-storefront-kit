import { describe, expect, it } from 'vitest';
import { extractHTML, scoreProducts } from './audit';
import { demoAudit } from './demo';
import { emptySteering, priceFor, simulate, readiness, effectiveSignals } from '../shared/storefront';
describe('storefront audit',()=>{
  it('extracts structured product facts without inventing stock',()=>{const d=extractHTML('<title>Shop</title><script type="application/ld+json">{"@type":"Product","name":"Bag","offers":{"price":"28","priceCurrency":"USD"}}</script>','https://example.com/bag');expect(d.products[0].price).toBe(28);expect(d.products[0].available).toBe(null);expect(d.products[0].currency).toBe('USD');});
  it('reports malformed structured data',()=>{expect(extractHTML('<script type="application/ld+json">bad</script>','https://example.com').malformed).toBe(true);});
  it('does not pass product checks on an empty catalog',()=>{expect(scoreProducts([],'','test').filter(s=>s.score===100)).toHaveLength(0);});
  it('keeps the audit score separate from merchant previews',()=>{const a=demoAudit();const s={...emptySteering,stock:'In stock',shipping:'Ships in 3 days',returns:'30-day returns'};expect(a.score).toBe(63);expect(readiness(effectiveSignals(a,s))).toBe(100);expect(a.score).toBe(63);expect(simulate(a,emptySteering).ready).toBe(false);expect(simulate(a,s).ready).toBe(true);});
  it('changes price under a reversible 10% discount',()=>{const a=demoAudit();const s={...emptySteering,discountEnabled:true};expect(priceFor(a.products[1],s)).toBe(61.2);expect(a.products[1].price).toBe(68);});
  it('hides the cheapest item and picks the next eligible product',()=>{const a=demoAudit();expect(simulate(a,emptySteering).product?.id).toBe('tote');expect(simulate(a,{...emptySteering,hiddenProductIds:['tote']}).product?.id).toBe('pack');});
  it('honors the dollar cap in the question',()=>{const a=demoAudit();expect(simulate(a,{...emptySteering,question:'cheapest under $60'}).product).toBeUndefined();});
});

describe('public HTML product cards',()=>{
  const html='<script>window.context={"selectedCurrency":"USD"};</script><div class="product-block-content"><a class="product-title" href="/shop-all/p/coffee">Coffee beans</a><img data-src="/coffee.jpg"/><div class="product-price">$20.00</div><div class="product-excerpt">Organic whole bean coffee with chocolate tasting notes and a medium roast.</div><button>Add to cart</button></div>';
  it('extracts Squarespace card facts without Product JSON-LD',()=>{const d=extractHTML(html,'https://example.com/shop');expect(d.products).toHaveLength(1);expect(d.products[0].price).toBe(20);expect(d.products[0].currency).toBe('USD');expect(d.products[0].url).toBe('https://example.com/shop-all/p/coffee');expect(d.products[0].image).toBe('https://example.com/coffee.jpg');});
  it('does not treat an add-to-cart button as verified inventory',()=>{const p=extractHTML(html,'https://example.com/shop').products[0];expect(p.available).toBe(null);expect(p.variants).toEqual([]);});
  it('does not infer USD from a dollar sign alone',()=>{const d=extractHTML(html.replace('"selectedCurrency":"USD"','"unrelated":"USD"'),'https://example.com/shop');expect(d.products[0].currency).toBe('');expect(scoreProducts(d.products,d.text,'test').find(s=>s.key==='pricing')?.score).toBe(0);});
});

describe('observed sold-out inventory',()=>{
  const html='<script>{"selectedCurrency":"USD"}</script><div class="product-block-content"><a class="product-title" href="/shop-all/p/tumbler">Fellow Cold Tumbler</a><div class="product-price">$40.00</div><a class="product-status-link"><div class="product-mark sold-out">Sold out</div></a></div>';
  it('recognizes the exact public sold-out badge and treats it as known stock',()=>{const d=extractHTML(html,'https://example.com/shop');expect(d.products[0].available).toBe(false);const signal=scoreProducts(d.products,d.text,'test').find(s=>s.key==='stock')!;expect(signal.score).toBe(100);expect(signal.evidence).toContain('1 sold out, 0 unknown');});
  it('never recommends a sold-out product after a merchant stock preview',()=>{const a=demoAudit();a.products=a.products.map(p=>({...p,available:false}));expect(simulate(a,{...emptySteering,stock:'Everything in stock',shipping:'3 days',returns:'30 days'}).product).toBeUndefined();});
});
