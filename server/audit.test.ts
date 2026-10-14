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
