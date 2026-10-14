# Agent Storefront Kit

**The merchant control panel for how shopping agents see a store.**

[Open the Vercel app](https://agent-storefront-kit.vercel.app) · [Hackathon criteria](HACKATHON.md)

## User problem

A store can look good to a person while exposing incomplete information to a shopping agent. Product prices might lack a currency, stock can be unclear, and shipping or return terms can be hard to find. Merchants do not have a practical way to inspect that view, understand the missing details, or preview how better context changes a recommendation.

Agent Storefront Kit turns the retrieved store information into a merchant-facing workspace. It does not claim that every agent sees the same thing or that a missing extracted field proves the store has no policy.

## Solution

Paste a storefront URL and inspect eight evidence-based checks: price and currency, stock evidence, images, descriptions, shipping, returns, variants, and support. Open a check to see product thumbnails, source fields, and suggested website fixes.

Connect the official **Shop MCP** catalog for live Shopify products, featured variant prices, and availability. Keep returned product links unchanged and use the merchant’s original media URLs.

Review prefilled shipping and return drafts. Actual website passages carry source links; otherwise suggestions are clearly labeled. Drafts, product visibility, featured-product preference, and a hypothetical discount are applied only when the merchant confirms them. They do not rewrite the source audit.

Ask **“What’s the best birthday gift under $50 from [store name]?”** The name follows the scanned URL. Preview the shopping agent’s answer using current details and proposed fixes. The model chooses from actual retrieved product IDs, while code checks source prices, currency, budget, visibility, and sold-out exclusion. Unobserved inventory is not presented as confirmed stock.

A protected daily Vercel job keeps checking the store without a prompt for each step. Completed operational summaries are stored privately and exposed in the public demo’s monitoring screen so merchants and judges can see the work and review suggested fixes.

## High-level PRD

**Primary user:** a merchant who wants shopping agents to understand and recommend the store’s products accurately.

**Core workflow:** check the store → review suggested website fixes → preview the shopping agent’s answer → monitor completed background checks.

**Store health:** the original score is based on the retrieved product sample and never rises just because a merchant entered proposed text. Product issues show the actual evidence. Sold out is known inventory, not a missing stock label; unknown inventory stays unknown.

**Merchant fixes:** shipping and return fields are prefilled, editable, and source-labeled. Edited source-based drafts retain the original excerpt for comparison. Nothing is applied to the preview until the explicit confirmation. Merchant-provided inventory confirmation does not turn a known sold-out product into an eligible item.

**Shopping-agent preview:** a store-specific gift question, a current-versus-proposed comparison, and a grounded product candidate. Live requests re-read the website or refresh Shop MCP. If refreshing fails, the app withholds a stale live comparison. If the model fails after a fresh read, deterministic checks can provide a clearly simplified comparison. A no-match result is valid when no product fits the budget.

**Background monitoring:** daily at 09:00 UTC, with a fixed production target of TOG24 and the query `rain jacket`. Save only derived operational metadata: completion time, target, score, number of products checked, check categories, and generic next actions. Do not cache Shop catalog products, product IDs, source prices, image URLs, product URLs, or raw responses.

**Out of scope:** live storefront edits, cart creation, checkout completion, orders, payments, multi-store tenant accounts, and universal agent-visibility claims.

## Technology stack and architecture

The frontend is **React 19, TypeScript, Vite, and Tailwind CSS**, with a responsive merchant workspace and explicit source-versus-preview state. The backend is **Express and Node-compatible Vercel Functions**. **Cheerio** extracts public HTML and Product JSON-LD; public fetching validates and pins DNS, rejects private addresses, and bounds redirects, response sizes, concurrency, and timeouts.

**Vercel AI Gateway** calls `openai/gpt-4.1-mini` once to compare both feeds, with a 550-output-token limit and a 12-second timeout. Server code validates the returned product choice. The displayed stock, price, and policy facts are derived from the retrieved data and explicit preview inputs, not trusted model assertions. No model-generated prices or invented products are accepted.

**Shop MCP** runs over stateless JSON-RPC at `https://mcp.shop.com/`. Requests carry current protocol/client metadata, discover the supported tool schema, and filter the catalog to the exact merchant domain. Prices are converted from currency minor units. Every returned warning remains visible, including in preview mode. Each live Shopify comparison refreshes the catalog; Shop product objects are excluded from saved history and catalog exports.

**Vercel Cron** invokes the bearer-protected `/api/cron` route at `0 9 * * *`. **Private Vercel Blob** stores derived background reports; the SDK uses project-scoped authentication. `/api/monitor/status` serves operational summaries with `Cache-Control: no-store`. This is a public hackathon demo of public-store readiness, not an authenticated private merchant account system.

Key modules:

- `client/src/pages/Home.tsx`: merchant workspace, source selection, current/proposed comparison, and history.
- `client/src/components/MerchantFixes.tsx`: editable, source-labeled drafts and explicit apply.
- `client/src/components/BackgroundChecks.tsx`: completed unattended checks and next actions.
- `server/audit.ts`, `server/publicFetch.ts`: bounded public-store extraction and evidence-based scoring.
- `server/shopMcp.ts`: live merchant-matched Shopify catalog and policy discovery.
- `server/gatewayShopper.ts`: one bounded semantic comparison with grounded product eligibility.
- `server/backgroundReports.ts`, `shared/backgroundReports.ts`: private operational-summary storage without catalog caching.
- `shared/catalogSafety.ts`: safe summary exports and exclusion of Shop results from stored history.
- `api/`: Vercel function entry points; `vercel.json`: bounded runtimes and the daily schedule.

## Hackathon track and Shopify side quest

Choose **Agents & Factories**. The app is deployed on Vercel, runs from a schedule without a prompt for every step, produces readiness work after the merchant leaves, and provides monitoring plus shopping-agent steering. The official rules encourage eve but do not require it.

The **Shopify side quest** is separate from the track award and accepts a commerce experience using Shop MCP, including discovery and a shopping agent. This app uses the actual public Shop MCP endpoint rather than only a fictional Shopify fixture. Live data, unchanged product URLs, original merchant image URLs, visible warnings, and no persisted Shop catalog comply with the published handling requirements. Checkout is not required; this demo does not create one or complete a purchase.

Organizers determine eligibility and winners. The entry still needs a **Public or Unlisted YouTube demo of three minutes or less**, the Vercel deployed URL, the chosen track, the team roster (at most four people), and setup instructions. Submit by **4:00pm PT on October 14, 2026**; 4:10pm is only the portal buffer. Repository links are optional. Full sourced criteria are in [HACKATHON.md](HACKATHON.md).

## Run the demo

The deployed app is public and requires no login. Paste a store URL and click **Check store**. The user-provided Motoring Club page exposes public Squarespace product cards; the scanner recognizes visible sold-out badges and retains unknown inventory separately.

For live Shopify discovery, open **Shopify catalog → Use public Shopify example → Connect & audit**. This uses TOG24 and `rain jacket`, an official quickstart category. Review suggested fixes, apply the drafts, and run the shopping-agent question. **Checks & history** shows completed background reports. The fictional Fieldwork demo is labeled as demo data; its $48 tote fits the new $50 gift prompt, and a hypothetical 10% offer makes its preview price $43.20.

## Development

Use `pnpm install --frozen-lockfile`, then `pnpm dev` on port 3000. Validate with `pnpm check`, `pnpm test`, and `pnpm build`. The regression suite has **28 passing tests**. Node ESM function imports use `.js` specifiers. Keys and bearer secrets remain server-only and are not committed.

Runtime configuration uses `AI_GATEWAY_API_KEY` or supported Vercel OIDC authentication, `AI_GATEWAY_ENABLED`, `AI_GATEWAY_MODEL`, `CRON_SECRET`, `MONITORED_STORE_URL`, `MONITORED_CATALOG_QUERY`, and the connected Blob store configuration. Rate limits are per runtime instance, not a durable account-wide limit.

## Demo video

The finished screen-recorded MP4 will be included under `demo/`. It shows actual interactions with the Vercel production app, live storefront extraction, live Shop MCP discovery, reviewed merchant drafts, a real Gateway product selection, and completed background work. A repository-hosted video does not replace the required Public or Unlisted YouTube submission link.

## Official resources

[Event rules and submission checklist](https://vercel.notion.site/Builder-Resources-Fast-Forward-3f3e06b059c4818eba9ada18e6f32dc0) · [Shop MCP quickstart](https://shop.dev/docs/quickstart) · [Vercel Shopify MCP implementation guide](https://vercel.com/kb/guide/build-a-shopify-mcp-agent-on-vercel) · [AI Gateway API](https://vercel.com/docs/ai-gateway/openai-compat)
