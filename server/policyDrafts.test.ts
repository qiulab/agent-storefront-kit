import { describe, expect, it } from 'vitest';
import { extractPolicyPassages, suggestedPolicyDrafts } from './policyDrafts.js';
describe('merchant policy prefills',()=>{
  it('keeps actual website shipping and return conditions verbatim',()=>{const p=extractPolicyPassages('<h2>Shipping</h2><p>We dispatch orders within 7 business days and charge $8 for domestic delivery.</p><h2>Returns</h2><p>Unused items in original packaging are accepted within 14 days of delivery.</p>');expect(p.shipping).toContain('7 business days');expect(p.shipping).toContain('$8');expect(p.returns).toContain('14 days');expect(p.returns).not.toContain('30 days');});
  it('does not mistake bare navigation links for an actual policy',()=>{const p=extractPolicyPassages('<nav><a href="/returns">Returns</a></nav><p>Shipping policy</p><p>Return policy</p>');expect(p.shipping).toBe('');expect(p.returns).toBe('');});
  it('labels unsourced policy suggestions rather than inventing a source',()=>{const p=suggestedPolicyDrafts();expect(p.returns.kind).toBe('suggested');expect(p.returns.sourceUrl).toBeUndefined();expect(p.shipping.note).toContain('not a policy found');});
});
