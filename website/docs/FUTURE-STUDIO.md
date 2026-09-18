# Future software integration

## Boundary delivered now

The marketing site is `/`. The future software destination is `/studio/`, currently a truthful coming-soon page. All studio links already resolve there. The current website contains no API calls, credentials, upload inputs, billing system or user data storage. Existing application code elsewhere in the repository is not connected to this site.

## Intended same-domain structure

```text
audiobookprep.com/
  /                 marketing website
  /studio/          future authenticated frontend
  /api/             optional reverse-proxy path to a separately hosted backend
```

The UI can live on the website even when the AI processing backend runs elsewhere. On a suitable host, route `/studio/*` to the application and `/api/*` to the server. If remaining on Squarespace, evaluate its supported embed options and authentication behavior, or migrate the frontend host to support path routing. Do not assume Squarespace can execute backend code.

## Build later

1. Identity, project ownership, memberships and server-side entitlement enforcement.
2. Private manuscript ingestion with size/type limits, parsing, job queue and cancellation.
3. Prep generation with chapter/source references, uncertainty handling and retry limits.
4. Editable character, chapter and pronunciation guides with saved version history.
5. Usage metering, billing webhooks, allowance refunds on failures and spending controls.
6. Export, team permissions, deletion and data-retention settings.

Put provider API keys only on the backend. The browser should receive authorized results, never provider secrets. Publish actual provider, retention and training policies before enabling uploads. Do not convert the fictional sample into an apparent live AI result.

## Visual continuity

Reuse the Manrope font, ink/indigo palette, accessible focus states and compact controls from `assets/site.css`. Product screens should prioritize readable manuscripts, source citations and review work over the marketing page's larger display typography. The public sample is illustrative, not an application component contract.
