export type SignalKey = 'pricing' | 'stock' | 'image' | 'description' | 'shipping' | 'returns' | 'variants' | 'contact';
export type Product = { id: string; title: string; description?: string; variants?: string[]; price: number | null; currency: string; available: boolean | null; image?: string; url?: string; source: string };
export type Signal = { key: SignalKey; label: string; score: number; evidence: string; source: string; fix: string };
export type Audit = { id: string; url: string; name: string; scannedAt: string; demo: boolean; products: Product[]; signals: Signal[]; score: number; rawText: string; trace: { tool: string; detail: string; status: string }[]; mcp?: { endpoint: string; connected: boolean; tools: string[]; error?: string } };
export type Steering = { shipping: string; returns: string; stock: string; guidance: string; preferredProduct: string; budget: number; hiddenProductIds: string[]; discountEnabled: boolean; question: string };
export const emptySteering: Steering = { shipping: '', returns: '', stock: '', guidance: '', preferredProduct: '', budget: 150, hiddenProductIds: [], discountEnabled: false, question: 'Find the cheapest product under $150.' };
export function effectiveSignals(audit: Audit, steer: Steering): Signal[] {
  return audit.signals.map(s => {
    const value = s.key === 'shipping' ? steer.shipping : s.key === 'returns' ? steer.returns : s.key === 'stock' ? steer.stock : '';
    return value.trim() ? { ...s, score: 100, evidence: value.trim(), source: 'Merchant preview · not verified' } : s;
  });
}
export function readiness(signals: Signal[]): number { return Math.round(signals.reduce((n, s) => n + s.score, 0) / signals.length); }
export function priceFor(product: Product, steer: Steering) { return product.price === null ? null : Math.round(product.price * (steer.discountEnabled ? 0.9 : 1) * 100) / 100; }
export function simulate(audit: Audit, steer: Steering) {
  const signals = effectiveSignals(audit, steer);
  const blockers = signals.filter(s => ['pricing','stock','shipping','returns'].includes(s.key) && s.score < 100).map(s => `${s.label}: ${s.evidence}`);
  const budgetMatch = steer.question.match(/(?:under|below|less than|budget)\s*\$?(\d+(?:\.\d+)?)/i);
  const budget = budgetMatch ? Number(budgetMatch[1]) : steer.budget;
  const eligible = audit.products.filter(p => !steer.hiddenProductIds.includes(p.id) && priceFor(p,steer) !== null && priceFor(p,steer)! <= budget && p.available !== false && p.currency === 'USD');
  const cheapest = /cheapest|lowest|affordable/i.test(steer.question);
  if (cheapest) eligible.sort((a,b) => priceFor(a,steer)! - priceFor(b,steer)!);
  const product = eligible.find(p => p.id === steer.preferredProduct) || eligible[0];
  if (!product) blockers.push('No visible product with a verified USD price fits the budget.');
  const ready = blockers.length === 0;
  return { ready, product, effectivePrice: product ? priceFor(product,steer) : null, blockers, score: readiness(signals), decision: ready ? `Recommend ${product!.title}` : 'Need a little more context', reason: ready ? `The selected product fits the $${budget} cap and the feed includes stock, shipping, and returns context. This is a recommendation, not a purchase.` : 'I found a candidate, but cannot recommend buying until the missing commerce facts are clarified.', steps: [ { tool: 'inspect_storefront', detail: `Read ${audit.products.length} products and 8 commerce checks.` }, { tool: 'evaluate_constraints', detail: `USD budget $${budget}; ${eligible.length} candidates. ${steer.hiddenProductIds.length} hidden; ${steer.discountEnabled ? '10% preview discount applied' : 'original prices used'}. Only budget and cheapest intent are parsed; no semantic product matching.` }, { tool: 'resolve_merchant_context', detail: steer.shipping || steer.returns || steer.stock || steer.guidance ? 'Applied labeled merchant preview context. No live store changes.' : 'No overrides. Use discovered evidence only.' }, { tool: 'purchase_decision', detail: ready ? `Recommend ${product!.title}. No cart or checkout created.` : `${blockers.length} blockers. Ask merchant for clarification.` } ] };
}
