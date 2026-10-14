# Agent Storefront Kit

**Watch what the agent sees, then change its mind.**

Production app: https://agent-storefront-kit.vercel.app

A merchant workspace that reads public storefront facts or official Shop MCP, scores eight evidence-based checks, previews merchant clarifications, and compares shopper decisions without editing the source store.

## Demo

Open **Preview fixes → Fill demo fixes → Run shopper & compare**. The fictional demo's audited score stays **63**, while preview readiness reaches **100**. Enable the first-order discount: the $68 candidate becomes **$61.20**. Hide the cheapest product to change the candidate. **Reset demo** clears the preview.

The **Use AI Gateway** checkbox enables semantic product matching. One request compares both feeds using `openai/gpt-4.1-mini`, a 550-output-token limit and 12-second timeout. There is no retry loop. Returned product IDs, prices, visibility, currency, budget, and stock eligibility are checked in code. Scores and prices never come from a model. Disabled or failed Gateway calls use the deterministic fallback. A verified production comparison used one call and 665 total tokens.

## Source coverage and issue previews

The scanner supports Product JSON-LD, explicit public product-card markup (including Squarespace), and discovery of up to two same-store product links when a landing page has no product facts. It does not execute arbitrary storefront JavaScript or claim full-catalog coverage. Empty pages become an explainable zero-product audit rather than an obstructive error.

The user-provided test URL `https://themotoringclub.com/shop#shop-motoring-coffee` was verified locally: 24 products were extracted from Squarespace HTML cards. Numeric prices and currency come from exposed markup/site currency context, not a dollar-sign assumption. A generic Add to cart button does not establish inventory; absent stock and variant evidence remain unknown and fail their checks.

Expand a readiness check to see affected-product thumbnails, the exact missing field, the evidence source, and a concrete source fix. Image absence is separate from an actual image loading failure. The first failed check opens automatically. Store-level policy gaps show which products depend on that context, without claiming the merchant has no policy.

## Shop MCP and daily audit

The official endpoint is `https://mcp.shop.com/`. Read-only requests use discovered schemas, protocol/client metadata, merchant filters, and exact merchant-domain matching. Prices are converted from currency minor units, URLs remain unchanged, and live media is never re-hosted. Shop results are not persisted in browser storage. Warnings and HTML fallback are explicit. TOG24 with query “rain jacket” was verified with 16 merchant-matched products.

Vercel Cron is enabled for **09:00 UTC daily** (`0 9 * * *`). Production configuration targets `https://www.tog24.com` with catalog query `rain jacket`. The cron endpoint rejects requests without its protected bearer secret. A verification run through Vercel's Cron interface produced a successful `[Daily audit]` runtime log. The hook re-audits without a new prompt, but does **not** persist unattended historical snapshots; durable history and regression alerts are deferred.

The project is deployed on Vercel and designed around Agents & Factories and the Shop MCP side quest. Final hackathon qualification is determined by the organizers, not this app.

## Development and boundaries

`pnpm install --frozen-lockfile`, then `pnpm dev` (port 3000). `pnpm check`, `pnpm test`, and `pnpm build` validate the source. The regression suite currently has **19 passing tests**. Vercel function imports use Node-compatible `.js` specifiers; the compiled Node ESM API tree was smoke-tested locally.

No cart, checkout, order, purchase, or live merchant edit is performed. Manual public-HTML history is browser-local. Public fetches validate and pin DNS, reject private networks, and bound redirects, size, timeout, rate, and concurrency. Gateway rate limits are per runtime instance, not a durable account-wide spending cap. API keys and cron secrets are server-only and never committed.

Official references: [event resources](https://vercel.notion.site/Builder-Resources-Fast-Forward-3f3e06b059c4818eba9ada18e6f32dc0), [Shop MCP](https://shop.dev/docs/quickstart), [AI Gateway](https://vercel.com/docs/ai-gateway/openai-compat).
