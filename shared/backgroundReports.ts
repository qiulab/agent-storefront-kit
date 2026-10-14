import type { Audit, SignalKey } from './storefront.js';

export type BackgroundReport = {
  id: string;
  checkedAt: string;
  store: string;
  storeUrl: string;
  status: 'completed' | 'partial' | 'failed';
  score: number | null;
  productCount: number;
  source: 'shop' | 'website' | 'unavailable';
  checks: { key: SignalKey; label: string; complete: boolean }[];
  nextActions: string[];
};

export function reportFor(audit: Audit): BackgroundReport {
  const gaps = audit.signals.filter(check => check.score < 100);
  return {
    id: audit.id,
    checkedAt: audit.scannedAt,
    store: audit.name,
    storeUrl: audit.url,
    status: audit.mcp?.connected ? 'completed' : 'partial',
    score: audit.score,
    productCount: audit.products.length,
    source: audit.mcp?.connected ? 'shop' : 'website',
    checks: audit.signals.map(check => ({ key: check.key, label: check.label, complete: check.score === 100 })),
    nextActions: gaps.slice(0, 3).map(check => check.fix),
  };
}
