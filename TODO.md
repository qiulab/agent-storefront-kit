# Agent Storefront Kit

- [x] Scan public HTTPS storefront/product pages. Normalize retrieved products, numeric prices, currencies, stock, images, descriptions, and returned variant labels. Reject unsupported or malformed data without inventing facts. Live Allbirds product HTML verified.
- [x] Show eight deterministic checks: price/currency, stock, images, descriptions, shipping, returns, variants, and contact. Include evidence source and concrete source fixes. Audited readiness is distinct from simulated readiness.
- [x] Show the agent-readable normalized feed and actual extraction trace. The rule-based shopper interprets USD budget and cheapest intent; clearly labeled as deterministic, not an LLM.
- [x] Preview merchant shipping, returns, stock context, product visibility, a 10% first-order discount, a preferred eligible product, and an announcement without editing the store.
- [x] Re-run the same shopper question and display before/after price, candidate, purchase blocker, and a causal change explanation.
- [x] Connect the official Shop MCP at mcp.shop.com with discovered tool schemas, protocol/client metadata, merchant-domain filters and matching, unchanged product URLs, live media, surfaced warnings, and explicit HTML fallback. Live merchant-matched TOG24 search returned 16 products through official Shop MCP. Allbirds-specific searches returned upstream service errors and fallback was verified.
- [x] Include a resettable fictional fixture demo: 63 audited score, 100 preview score after clarifications; $68 becomes $61.20 under a 10% preview discount; hiding the cheapest item changes the candidate.
- [x] Responsive merchant control panel, browser-local public HTML history, JSON export, connection dialog, monitoring setup status, verified public preview, 13 passing tests, successful typecheck and production build.
- [x] Provide Vercel-compatible API wrappers and a protected daily cron hook. Source code configuration alone is not presented as an active schedule.
- [x] Deploy on Vercel after confirmation, configure the monitored storefront and cron secret, and verify useful unattended work through a protected Cron test run. Vercel shows the enabled 09:00 UTC schedule; the test run emitted a successful Daily audit log. Organizer qualification is not guaranteed.
- [ ] Durable unattended snapshots and regression alerts are deferred. The UI states that scheduled history is not stored.

No paid model call, purchase, cart, checkout, live Shopify edit, or persistent infrastructure was initiated. Official track and side-quest requirements and deployment instructions are recorded in README.md.

- [x] Redesign the workspace with larger readable typography, a lighter sidebar, clearer navigation labels, a visible three-step workflow, and the first missing-signal preview open by default.
- [x] Show affected-product thumbnails and exact missing fields; distinguish absent image URLs from actual image loading failures.
- [x] Add opt-in AI Gateway semantic comparison with one 550-output-token request, grounded eligibility revalidation, request telemetry, and zero-call fallback. Production verified with one request and 665 tokens.
- [x] Fix the user-provided Motoring Club URL: extract public Squarespace cards, preserve unknown stock/currency facts, discover up to two same-store product links when needed, and show a clear empty-product state. Local exact-URL verification found 24 products; 19 regression tests pass.
