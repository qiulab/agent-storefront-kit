# Fast Forward qualification

Choose **Agents & Factories**. Its published entry criteria are deployment on Vercel, asynchronous or schedule/event-driven execution, useful work without a manual prompt for every step, and a way for a person to monitor and steer the system. **eve is encouraged, not required.** Next.js and AI SDK are implementation examples, not stated track requirements. [1]

The Shopify side quest is separate from the track award and open to every track. It requires a commerce experience using **Shop MCP**, ranging from product discovery to a shopping agent. The Shopify judge selects the eligible winner during final-round judging; using Shop MCP does not guarantee an award. A cart or checkout is not stated as a requirement. [1]

Shopify handling must fetch results live, avoid caching Shop results or re-hosting merchant images, and preserve the product URLs exactly. If a checkout is added, use one per merchant and hand the shopper to its `continue_url`; do not complete a purchase in the demo. Every warning returned by Shop must be shown. The public endpoint is `https://mcp.shop.com/`; no account or API key is needed. [1] [2]

## Current build and improvements

The app is deployed at https://agent-storefront-kit.vercel.app. Its protected Vercel Cron job runs daily at 09:00 UTC, invokes live catalog discovery, evaluates eight store checks, and produces a summary without a manual prompt. The existing merchant preview steers product visibility, featured-product preference, proposed policies, and a hypothetical offer; the shopper comparison uses AI Gateway with grounded price, currency, inventory, and product-ID checks.

The current implementation already supports live merchant-matched Shop discovery and preserves returned image and product URLs. Two gaps identified in this review are being corrected: completed background work should be visible in the merchant UI, and live Shop result objects must not be reopened from session history or exported as a cached catalog. Shopify warnings also need to remain visible in merchant preview mode.

## Required submission

Submit under **Agents & Factories** by **4:00pm PT on October 14, 2026**. The portal remains open to 4:10pm only as a buffer. Supply the deployed demo, the chosen track, the team roster of at most four people, a problem/technology description, setup instructions, and a **YouTube demo of three minutes or less, Public or Unlisted**. Put the required video URL in Social Links and test it while signed out. Repository links are optional. [1]

No submission or public video has been created by this review. Those remain required user entry steps. This document describes compliance evidence; organizers determine eligibility and the award outcome.

## References

[1]: https://vercel.notion.site/Builder-Resources-Fast-Forward-3f3e06b059c4818eba9ada18e6f32dc0 "Fast Forward — Tracks, Shopify, and Submissions tabs"
[2]: https://shop.dev/docs/quickstart "Shop MCP official quickstart and result handling"
[3]: https://vercel.com/kb/guide/build-a-shopify-mcp-agent-on-vercel "Vercel implementation guide for a Shopify MCP agent"
