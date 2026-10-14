# Agent Storefront Kit — design revision

The user requests a friendlier, more appealing interface while preserving the working public-store audit, official Shop MCP, merchant previews, before/after comparison, Gateway opt-in, and daily TOG24 audit.

## Design direction

Three candidate styles: warm merchant studio (0.06), crisp electric-cobalt product workspace (0.04), editorial monochrome instrument panel (0.03). Choose **warm merchant studio**, an approachable contemporary SaaS workspace with editorial hierarchy.

**Design movement:** warm modernism, combining an off-white canvas, ink typography, white cards, soft rounded surfaces, and restrained emerald accents.

**Core principles:** readable first; one obvious next action; reveal visual issue evidence before technical details; make source versus preview unmistakable. Text should no longer be 7–10px or low contrast. Standard body text is 14–16px. Controls have at least 42px height.

**Color philosophy:** deep ink supports confident reading, warm neutrals make the tool feel familiar to merchants, emerald denotes confirmed facts and primary actions, amber identifies missing context without implying a proven store defect. Signature brand color: rich emerald #16805D.

**Layout:** a light compact sidebar, a welcoming store overview, a wide URL scan control, and a split workspace with the readiness breakdown as the primary reading column and an actionable next-step card. Avoid a marketing hero or decorative artwork; this is a usable control panel.

**Signature elements:** a prominent circular readiness indicator; visual affected-product thumbnails alongside missing fields; a compact three-step path from scan to inspect to preview.

**Interactions and animation:** issue rows clearly invite expansion, the first failing issue opens by default, mobile navigation keeps readable labels, and merchant previews stay reversible. Transitions are short 120–180ms and never obscure data. Respect reduced motion.

**Typography:** Manrope for headings, DM Sans for interface/body, IBM Plex Mono only for source fields and diagnostics. Large headings 30–38px; body 14–16px; secondary labels no smaller than 11px.

**Brand essence:** the approachable workspace helping merchants understand and improve what shopping agents can read. Clear, capable, reassuring.

**Voice:** practical action labels: “Find what agents are missing” and “Preview the fixes.” Avoid vague marketing filler. Wordmark: retain the distinctive eye mark with agentkit, using the emerald accent and a compact storefront-control descriptor.

## Structure and implementation

- `client/src/pages/Home.tsx`: existing workspace state, tabs, scan/connection controls, score and shopper comparison. Preserve all backend wiring; simplify labels and add next-step guidance.
- `client/src/components/IssuePreview.tsx`: product thumbnails, exact retrieved fields, affected-product counts, policy dependencies, and actual image loading failures.
- `client/src/index.css`: replace the old low-contrast tiny-text rules with a coherent accessible stylesheet, responsive cards, and labeled mobile navigation.
- `shared/storefront.ts`: deterministic scoring and grounded eligibility remain unchanged.
- `server/`: existing public fetch, audit, Shop MCP, bounded Gateway comparison and cron handlers remain unchanged.
- `api/` and `vercel.json`: Vercel function wrappers, 60-second bounded execution, and protected 09:00 UTC daily audit.

No new imagery, model calls, or purchases are needed for the redesign. Existing illustrative demo product images and live merchant images remain in their planned product/evidence placements. Preserve live Gateway secrets and all existing app functionality.

## Merchant-facing refinement

The approved refinement removes the simulated preview score from the overview while retaining the original store-check score. Place one concise horizontal workflow at the very top: **1 Check your store → 2 Review missing details → 3 Preview improvements**. Increase interface text sizes and contrast consistently, including secondary text, source labels, and field notes.

Merchant fixes should arrive prefilled. Add a bounded public-website policy lookup that extracts actual shipping/return passages and follows at most two relevant same-store policy links. Every prefill distinguishes **From your website** (with the exact source URL) from **Suggested draft—review before using**. Do not infer real return windows, fees, shipping thresholds, or stock. Keep drafts separate from applied preview controls until the merchant clicks **Use these details in preview**. Unknown inventory is not auto-confirmed; existing sold-out items remain excluded.

The preview should speak to merchants: customer question, current details, proposed details, and why the answer changes. Hide Gateway, model, token, latency, protocol, deterministic-engine labels and execution jargon from the preview. Retain the existing bounded semantic-comparison backend and fallback, invoked only when the merchant runs a preview; no extra model calls are needed to create policy drafts.

Add `server/policyDrafts.ts`, `api/policies.ts`, and a focused `client/src/components/MerchantFixes.tsx`. Keep the existing source-of-truth audit, Shop catalog, Vercel configuration, and protected daily checks unchanged.

## Qualification and demo refinement

Keep the current merchant design and Vercel deployment. Add `server/backgroundReports.ts` to turn each scheduled audit into a derived operational summary and save it in a private Vercel Blob store. The summary includes execution time, target, completion state, score, check categories, and generic next actions; it excludes Shop products, product IDs, price values, image URLs, product URLs, and raw catalog payloads. The monitor API reads these summaries across function instances. `client/src/components/BackgroundChecks.tsx` renders completed unattended work and links into the existing merchant review and steering flow.

Separate live catalogs from manual HTML history. Use shared helpers for non-catalog exports/history, keep Shop warning text visible in every merchant view, and refresh official Shop MCP before each Shopify shopper comparison. Preserve exact returned product URLs, unchanged source prices, and explicitly hypothetical discount labels. Keep source evidence available in the audit while removing the requested redundant header helper and sample disclaimer. Use “shopping agent” consistently and a store-specific birthday-gift question under $50.

Create a narrated screen-recording of the public deployed app, not an AI-generated UI scene. Use real, signed-out browser interactions; show website extraction, live Shop discovery, the applied merchant preview and actual comparison, and durable background summaries. Compress network waiting transparently if needed, keep narration grounded in observed results, and export a playable 1080p MP4 under three minutes. Give the user the required YouTube submission steps; do not claim a credit balance or submit/upload publicly without authorization.
