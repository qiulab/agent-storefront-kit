# Verified deployment references

Vercel workspace: fawnqiu-5106s-projects (display name mimicat2026).
Team ID: team_9N90gM9zZ1jLz9gS1XcGUE6V.
Project: agent-storefront-kit, ID prj_B4QaLICkYbejMO8rII7bUXjdkcHZ.
Production domain currently assigned: https://agent-storefront-kit.vercel.app.
Git source: private https://github.com/qiulab/agent-storefront-kit.

The original configured connector cannot access the workspace (403). The user authenticated the browser, which can access the exact intended workspace. Existing Gateway secret values were not read or replaced. Browser project metadata showed AI_GATEWAY_API_KEY declared for production, preview, and development. The project OIDC configuration is enabled with issuerMode=team.

The authenticated Vercel browser confirmed HTTP 200 for build configuration (Vite, pnpm build, dist/public, Node 22) and HTTP 201 with no failures for production runtime values: MONITORED_STORE_URL=https://www.tog24.com, MONITORED_CATALOG_QUERY=rain jacket, AI_GATEWAY_ENABLED=true, AI_GATEWAY_MODEL=openai/gpt-4.1-mini. CRON_SECRET was generated securely in the browser and saved as sensitive; its value is never recorded here or in source.

AI Gateway OpenAI-compatible endpoint: https://ai-gateway.vercel.sh/v1/chat/completions. Official documentation: https://vercel.com/docs/ai-gateway/openai-compat. Both AI_GATEWAY_API_KEY and VERCEL_OIDC_TOKEN are supported auth methods. The live public model catalog returned openai/gpt-4.1-mini, openai/gpt-4.1-nano, google/gemini-2.5-flash-lite, and meta/llama-4-scout.

The environment endpoint is documented at https://vercel.com/docs/rest-api/reference/endpoints/projects/create-one-or-more-environment-variables (POST /v10/projects/{idOrName}/env). The signed-in Vercel browser uses the same versioned routes under https://vercel.com/api/.

Source changes alone are not deployment success. Verify the intended commit's deployment, public frontend and API behavior, Gateway execution, and cron configuration before reporting completion.
