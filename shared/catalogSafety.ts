import type { Audit, Steering } from './storefront.js';

export function savedWebsiteHistory(history: Audit[]) {
  return history.filter(audit => !audit.mcp?.connected);
}

export function exportFor(audit: Audit, steer: Steering) {
  if (audit.mcp?.connected) {
    return {
      store: audit.url,
      checkedAt: audit.scannedAt,
      score: audit.score,
      checks: audit.signals.map(check => ({ key: check.key, complete: check.score === 100 })),
      note: 'Readiness summary only. Live Shop products, prices, images, URLs, and catalog responses are not exported.',
    };
  }
  return { audit, preview: steer, notice: 'Proposed merchant details are a preview, not a source-store update.' };
}
