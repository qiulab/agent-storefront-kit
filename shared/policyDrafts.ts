export type PolicyDraft = { text: string; kind: 'found' | 'suggested'; sourceUrl?: string; note: string };
export type PolicyDrafts = { shipping: PolicyDraft; returns: PolicyDraft };
export function suggestedPolicyDrafts(): PolicyDrafts {
  return {
    shipping: { text: 'Orders dispatch within 2–3 business days. Delivery estimates and shipping charges are shown at checkout. Contact us if you need an order by a particular date.', kind: 'suggested', note: 'Suggested draft—not a policy found on your website. Confirm dispatch times and delivery charges before using it.' },
    returns: { text: 'Unused items in their original packaging may be returned within 30 days of delivery. Please contact us before returning an item. Customers cover return shipping unless the item arrived damaged.', kind: 'suggested', note: 'Suggested draft—not a policy found on your website. Confirm the return window, exclusions, and fees before using it.' }
  };
}
