import { describe, expect, it } from 'vitest';
import { demoAudit } from './demo.js';
import { emptySteering, steeringFor } from '../shared/storefront.js';
import { exportFor, savedWebsiteHistory } from '../shared/catalogSafety.js';
import { reportFor } from '../shared/backgroundReports.js';

describe('hackathon data handling', () => {
  it('does not reopen live Shop results from history', () => {
    const website = demoAudit();
    const shop = { ...website, id: 'live', demo: false, mcp: { connected: true, endpoint: 'https://mcp.shop.com/', tools: [] } };
    expect(savedWebsiteHistory([shop, website])).toEqual([website]);
  });
  it('exports only a readiness summary for live Shop', () => {
    const audit = { ...demoAudit(), mcp: { connected: true, endpoint: 'https://mcp.shop.com/', tools: [] } };
    const result = exportFor(audit, emptySteering);
    expect(result).not.toHaveProperty('audit');
    expect(result).not.toHaveProperty('products');
    expect(JSON.stringify(result)).not.toContain(audit.products[0].id);
    expect(result).toHaveProperty('checks');
  });
  it('background metadata excludes raw catalog, products, prices, image and product URLs', () => {
    const audit = demoAudit();
    const report = reportFor(audit);
    expect(report).not.toHaveProperty('products');
    expect(report).not.toHaveProperty('rawText');
    expect(report).not.toHaveProperty('mcp');
    expect(JSON.stringify(report)).not.toContain(audit.products[0].title);
    expect(report.checks).toHaveLength(8);
    expect(report.nextActions.length).toBeGreaterThan(0);
  });
  it('uses the current shop name and a $50 birthday-gift cap', () => {
    const steer = steeringFor({ name: 'The Motoring Club' });
    expect(steer.question).toBe('What’s the best birthday gift under $50 from The Motoring Club?');
    expect(steer.budget).toBe(50);
  });
});
