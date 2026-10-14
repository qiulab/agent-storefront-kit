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
