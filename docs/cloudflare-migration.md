# Independent Cloudflare hosting — migration in progress

The live shop is still https://matchamates.roundeel68.chatgpt.site/.
This branch prepares independent Workers + D1 hosting. It has not replaced the live site.

## Resources created

- Cloudflare account: 3c4ce0d8bab43bfe3ac48b3a8a843e53
- Workers subdomain: matchamates-gracia
- D1 database: matcha-mates (c8766511-d0ab-4262-a7ea-92214817afb3), Asia Pacific
- Tables: products, orders, with the original schema
- Copied three live product records on 25 October 2026. The source had zero orders at that check. Recheck both tables at cutover; the old database remains the source of truth meanwhile.

## Local and deployment commands

```sh
npm ci
npm run test:shop
npm run test:cloudflare-auth
npx tsc --noEmit
npm run build:cloudflare
npm run deploy:cloudflare
```

Use the Cloudflare build/deploy commands for independent hosting. The original Sites build remains available for the existing host. Cloudflare Vite/Vinext emits the independent build in dist/server and dist/client. Do not deploy an old Sites build by mistake.

## Owner authentication — must configure before launch

Enable Cloudflare Zero Trust / Access on the account first. Its onboarding requires the owner to select the Free plan and may require payment details. No paid plan has been selected by this migration.

Create a self-hosted Access application for the deployed worker's /admin and /api/admin paths (including their subpaths). Keep the customer-facing pages and /api/products and /api/orders public. Allow only the owner's email. Enable one-time email PIN as the login method if desired. Record the exact application audience and team domain returned by Access.

Set these runtime values on the Worker, outside Git:

- OWNER_EMAIL: the verified owner's email
- CF_ACCESS_TEAM_DOMAIN: https://<exact-team-name>.cloudflareaccess.com, without trailing slash
- CF_ACCESS_AUD: the exact audience for the Access application protecting admin and admin API

The independent build verifies the JWT signature, issuer, audience, expiry, subject and owner email. Missing or invalid login settings deny access. It does not trust OpenAI identity headers. The Sites build continues using its existing Sites login.

The Cloudflare Access application should cover both admin paths with one audience. Do not create separate audiences unless code/config is updated to verify each separately.

## Before switching customers

1. Enable and verify Access; configure the Worker runtime settings.
2. Connect this GitHub branch to Workers Builds, or deploy the tested artifact using an authenticated Wrangler session. This has not been connected automatically.
3. Test public pages, product prices, order persistence, stock handling and owner login. Confirm anonymous visitors cannot list orders or edit products.
4. Re-read the live Sites database immediately before cutover. Transfer any changes/new orders using parameterized inserts and verify row counts and values. Never put customer records in Git.
5. Switch the shared link only after the checks pass. Prevent old-site order submissions at the agreed cutover so the two databases do not diverge.
6. Keep the old host available for rollback; do not delete its database.

No independent deployment has been published yet. No customer records or secrets are stored in this repository.
