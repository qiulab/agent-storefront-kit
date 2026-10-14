import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Loader2, RefreshCw, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import type { Audit, Steering } from '@shared/storefront';
import { suggestedPolicyDrafts, type PolicyDrafts } from '@shared/policyDrafts';

type Props = { audit: Audit; steer: Steering; onApply: (fields: Partial<Steering>) => void; onClear: () => void };
export default function MerchantFixes({ audit, steer, onApply, onClear }: Props) {
  const defaults = suggestedPolicyDrafts();
  const [policies, setPolicies] = useState<PolicyDrafts>(defaults);
  const [shipping, setShipping] = useState(steer.shipping || defaults.shipping.text);
  const [returns, setReturns] = useState(steer.returns || defaults.returns.text);
  const [guidance, setGuidance] = useState(steer.guidance || 'Help shoppers find products that match their request. Use the listed product details and never recommend an item marked sold out.');
  const [confirmedStock, setConfirmedStock] = useState(!!steer.stock);
  const [loading, setLoading] = useState(!audit.demo);
  const [lookupError, setLookupError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [applied, setApplied] = useState(false);
  const [preferredProduct, setPreferredProduct] = useState(steer.preferredProduct);
  const [hiddenProductIds, setHiddenProductIds] = useState([...steer.hiddenProductIds]);
  const [discountEnabled, setDiscountEnabled] = useState(steer.discountEnabled);
  useEffect(() => {
    if (audit.demo) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setLookupError(false);
    fetch('/api/policies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: audit.url }) })
      .then(async response => { if (!response.ok) throw new Error('Policy lookup unavailable'); return response.json(); })
      .then((data: PolicyDrafts) => { if (cancelled) return; setPolicies(data); setShipping(steer.shipping || data.shipping.text); setReturns(steer.returns || data.returns.text); })
      .catch(() => { if (!cancelled) setLookupError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [audit.id, refresh]);
  const unknown = audit.products.filter(product => product.available === null).length;
  const soldOut = audit.products.filter(product => product.available === false).length;
  function apply() {
    onApply({ shipping, returns, guidance, preferredProduct, hiddenProductIds, discountEnabled, stock: confirmedStock ? 'The merchant confirms that products with previously unknown inventory are available. Items already marked sold out remain unavailable.' : '' });
    setApplied(true); toast.success('Details added to the preview. Try a shopper question next.');
  }
  function source(key: 'shipping' | 'returns') {
    const policy = policies[key];
    const edited = (key === 'shipping' ? shipping : returns).trim() !== policy.text.trim();
    return <div className="policy-provenance"><span className={`policy-source ${policy.kind}`}>{policy.kind === 'found' ? edited ? 'Edited draft · based on your website' : 'From your website' : edited ? 'Your edited draft · review first' : 'Suggested draft · review first'}</span>{policy.sourceUrl && <a href={policy.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight size={13} /></a>}<p>{edited ? 'You’ve edited this proposed text. Review your changes before applying them to the preview.' : policy.note}</p>{policy.kind === 'found' && edited && <details className="policy-original"><summary>Compare with the original excerpt</summary><blockquote>{policy.text}</blockquote></details>}</div>;
  }
  return <section className="steer-panel merchant-fixes">
    <div className="panel-heading"><SlidersHorizontal size={18} /><h2>Your proposed improvements</h2><span className="pill amber">Draft only</span></div>
    <div className="preview-warning"><ShieldCheck size={18} /><p>Review these drafts before using them in the preview.</p></div>
    <div className="prefill-status">{loading ? <><Loader2 size={15} className="spin" /> Finding policies on your website…</> : <><Check size={15} /> {lookupError ? 'Website lookup unavailable. Suggestions are ready to review.' : 'Your policy drafts are ready.'}</>}{!audit.demo && !loading && <button onClick={() => setRefresh(value => value + 1)} title="Look up website policies again"><RefreshCw size={14} /></button>}</div>
    <div className="control-fields">
      <label>Shipping & delivery{source('shipping')}<textarea value={shipping} disabled={loading} maxLength={850} onChange={event => { setShipping(event.target.value); setApplied(false); }} /></label>
      <label>Returns & refunds{source('returns')}<textarea value={returns} disabled={loading} maxLength={850} onChange={event => { setReturns(event.target.value); setApplied(false); }} /></label>
      <label>How to guide the shopping agent<span className="field-note">Suggested guidance. Adjust it to suit your store.</span><textarea value={guidance} maxLength={850} onChange={event => { setGuidance(event.target.value); setApplied(false); }} /></label>
      <div className="inventory-review"><strong>Keep inventory honest</strong><p>{soldOut} items are marked sold out; {unknown} have an unknown stock status in this scan. Sold-out items stay excluded.</p>{unknown > 0 && <label><input type="checkbox" checked={confirmedStock} onChange={event => { setConfirmedStock(event.target.checked); setApplied(false); }} /><span>I have verified that the items with unknown stock are available.<small>Only confirm this after checking your actual inventory.</small></span></label>}</div>
      <label>Featured product<select value={preferredProduct} onChange={event => {setPreferredProduct(event.target.value);setApplied(false);}}><option value="">Choose the best match for the shopper</option>{audit.products.map(product => <option key={product.id} value={product.id} disabled={product.available === false}>{product.title}{product.available === false ? ' — sold out' : ''}</option>)}</select></label>
      <div className="visibility-list"><strong>Products included in the preview</strong>{audit.products.slice(0,8).map(product => <label key={product.id}><input type="checkbox" checked={!hiddenProductIds.includes(product.id)} onChange={event => {setHiddenProductIds(event.target.checked ? hiddenProductIds.filter(id => id !== product.id) : [...hiddenProductIds, product.id]);setApplied(false);}} />{product.title}</label>)}</div>
    </div>
    <label className="toggle-row"><div><strong>Try a first-order offer</strong><small>Preview 10% off without changing your listed prices.</small></div><input type="checkbox" checked={discountEnabled} onChange={event => {setDiscountEnabled(event.target.checked);setApplied(false);}} /><span className="toggle-switch" /></label>
    <div className="merchant-apply"><button className="btn primary full" onClick={apply} disabled={loading}>{applied ? <Check size={16} /> : <SlidersHorizontal size={16} />}{applied ? 'Details added to preview' : 'Use these details in preview'}</button><button className="text-button" onClick={() => { onClear(); setConfirmedStock(false); setPreferredProduct(''); setHiddenProductIds([]); setDiscountEnabled(false); setApplied(false); }}>Clear applied changes</button></div>
  </section>;
}
