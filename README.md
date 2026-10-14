# Agent Storefront Kit

**Watch what the agent sees, then change its mind.**

A merchant control panel for public Product JSON-LD and live Shop MCP. Eight deterministic checks reveal the evidence an agent can retrieve. Reversible merchant previews compare shopper decisions without editing the live store. No model calls are required.

## Run and demo

`pnpm install --frozen-lockfile` then `pnpm dev` (port 3000). Validate with `pnpm check`, `pnpm test`, and `pnpm build`.

Start with the fictional Fieldwork Supply fixture: audited readiness **63**. Open **Steer controls**, click **Fill demo fixes**, then **Run shopper & compare**. Missing stock, shipping, and returns context becomes an eligible recommendation. Audited readiness stays 63; simulated readiness becomes 100. Enable the 10% preview discount: $68 becomes $61.20. Hide the cheapest item and the next candidate wins. **Reset demo** clears the preview.

For a live store, enter its HTTPS URL and catalog query in the Shop connection dialog. Product pages work better than home pages for public JSON-LD extraction.

## PRD improvements adopted

The supplied PRD improves the initial scope with eight explainable checks, an explicit preview/source separation, and scheduled-work criteria. This implementation adds evidence and concrete source fixes per check, separate audited and simulated scores, and an explanation of why the answer changed. Visibility, discount, announcement, shipping, returns, and availability controls remain preview-only.

The shopper parses USD budget and cheapest intent over the existing feed; it is not an unrestricted semantic-search model. Merchant announcements are included in the preview context but do not override grounded price or inventory. A sampled page or featured-variant result set cannot prove full catalog completeness.

## Shop MCP

The official endpoint is `https://mcp.shop.com/`. Requests use protocol `2026-07-28`, client metadata, discovered tool schemas, merchant filters, and exact merchant-domain matching. Prices are converted from currency minor units. Product URLs stay exactly as returned. Live merchant images use their returned URLs and are never re-hosted. Shop results are not persisted in browser storage. Returned warnings are displayed.

The adapter calls only `tools/list` and read-only `search_catalog`. A merchant policy tool at `/api/mcp` can enrich shipping and refund context. Unavailable or unmatched Shop results explicitly fall back to public HTML. No carts, checkouts, orders, customer records, or payments are created. Verified live Shop integration: https://www.tog24.com with query “rain jacket” returned 16 exact-domain matched products. Allbirds queries returned upstream errors; HTML fallback was verified and is labeled honestly.

## Deployment and qualification

The official **Agents & Factories** track requires Vercel deployment, asynchronous or scheduled/event-driven work, useful work without a prompt for every step, and human monitoring/steering. The Shopify side quest requires **Shop MCP**, not merely a store-specific Shopify MCP endpoint.

`api/` exposes Vercel-compatible functions; the frontend builds to `dist/public`. `vercel.json` declares a daily cron at 09:00 UTC. Set `MONITORED_STORE_URL` and a protected `CRON_SECRET`. `GET /api/cron` is fail-closed unless bearer authorization matches the secret. It returns a fresh audit; it does **not** persist unattended history. The dashboard labels monitoring as setup-required until configured. A code declaration is not proof of an executed schedule. **Track qualification is not claimed until Vercel deployment and useful unattended execution are verified.**

Persistent snapshots, regression alerts, and multi-store accounts are deferred. Manual public-HTML history uses browser-local storage only. No paid account upgrade or persistent infrastructure has been started.

HTTPS-only fetches pin validated DNS addresses, reject private networks, and cap redirects, timeouts, size, concurrency, and request rates.

## References

Event Tracks and Shopify tabs: https://vercel.notion.site/Builder-Resources-Fast-Forward-3f3e06b059c4818eba9ada18e6f32dc0

Shop MCP: https://shop.dev/docs/quickstart and https://shop.dev/docs/tools

Shopify store policy MCP: https://shopify.dev/docs/apps/build/storefront-mcp

Demo product photos are illustrative images, separate from live Shop media and not claims about actual merchant products.
