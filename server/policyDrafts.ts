import * as cheerio from 'cheerio';
import { publicFetch } from './publicFetch.js';
import { suggestedPolicyDrafts, type PolicyDrafts } from '../shared/policyDrafts.js';
export { suggestedPolicyDrafts } from '../shared/policyDrafts.js';

export function extractPolicyPassages(html: string): { shipping: string; returns: string } {
  const $ = cheerio.load(html);
  $('script,style,noscript,svg,nav').remove();
  const parts: { shipping: string[]; returns: string[] } = { shipping: [], returns: [] };
  let section: 'shipping' | 'returns' | null = null;
  let following = 0;
  $('h1,h2,h3,h4,p,li,dt,dd').each((_i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (!text || text.length > 1500) return;
    if (/^h[1-4]$/.test(el.tagName)) {
      section = /\b(return|refund|exchange)s?\b/i.test(text) ? 'returns' : /\b(shipping|delivery|dispatch)\b/i.test(text) ? 'shipping' : null;
      following = section ? 3 : 0;
      if (text.length >= 45 && section) parts[section].push(text);
      return;
    }
    if (text.length < 45) return;
    if (section && following > 0) { parts[section].push(text); following--; }
    if (/\b(shipping|delivery|dispatch|we ship|ships within)\b/i.test(text) && /\b(days?|weeks?|cost|free|checkout|tracking|countries|international|domestic|charges?|orders?)\b/i.test(text)) parts.shipping.push(text);
    if (/\b(return|refund|exchange)s?\b/i.test(text) && /\b(days?|unused|condition|damaged|fees?|shipping|original|purchase|delivery|eligible|window)\b/i.test(text)) parts.returns.push(text);
  });
  return { shipping: [...new Set(parts.shipping)].join('\n').slice(0, 850), returns: [...new Set(parts.returns)].join('\n').slice(0, 850) };
}
export async function policyDraftsFor(input: string): Promise<PolicyDrafts> {
  const drafts = suggestedPolicyDrafts();
  const response = await publicFetch(input);
  if (response.status >= 400) return drafts;
  function use(html: string, sourceUrl: string) {
    const found = extractPolicyPassages(html);
    for (const key of ['shipping', 'returns'] as const) if (found[key] && drafts[key].kind !== 'found') drafts[key] = { text: found[key], kind: 'found', sourceUrl, note: 'Taken from your website. Review this excerpt for completeness before using it in the preview.' };
  }
  use(response.text, response.url);
  if (drafts.shipping.kind === 'found' && drafts.returns.kind === 'found') return drafts;
  const $ = cheerio.load(response.text); const origin = new URL(response.url).origin;
  const links = [...new Set($('a[href]').map((_i, a) => {
    try {
      const u = new URL($(a).attr('href')!, response.url); const label = $(a).text() + ' ' + u.pathname;
      if (u.origin !== origin || u.protocol !== 'https:' || /cart|checkout|account|login/i.test(u.pathname) || !/shipping|delivery|returns?|refunds?|exchanges?|faq|policies|customer-care/i.test(label)) return '';
      u.hash = ''; return u.href;
    } catch { return ''; }
  }).get().filter(Boolean))].slice(0, 2);
  const pages = await Promise.all(links.map(async link => { try { const r = await publicFetch(link); return r.status < 400 ? r : null; } catch { return null; } }));
  for (const page of pages) if (page) use(page.text, page.url);
  return drafts;
}
