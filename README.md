# Matcha Mates

A small matcha community site and creative shop. Pages: About us, Menu, Creatives, and Contact us (Instagram). Includes the original Canva page 24 menu and page 20 sticker preview, plus the owner's supplied butter jar mockup.

## Stack

React with Vinext; Cloudflare Workers for backend routes; Cloudflare D1 for saved product listings and order requests. Sites manages authentication, database provisioning, migrations, and deployment.

## Shop

- Matcha butter spread starts at **RM10 per bottle**, marked Coming soon while the recipe is tested. First-batch requests are saved as waitlist entries.
- Matcha charms: Coming soon. The reference image is credited to @claybyan.
- Stickers: available by Instagram enquiry until a price and stock are set.
- The `/admin` dashboard manages products, prices, availability, unreserved stock, and requests.
- Order totals use the saved database price. Requests are idempotent. Pending orders reserve stock; cancellation restores it. No payment processing is included.
- Admin pages and APIs require the signed-in owner's email to match the `OWNER_EMAIL` runtime secret. Order contacts are never returned by public routes.

## Run locally

Follow the bundled starter setup instructions, install dependencies, and set `OWNER_EMAIL` in an ignored `.dev.vars` file. Run `npm run db:generate` only after changing the schema. Build with the Sites build helper, then apply pending SQL migrations to the local D1 database before previewing. Local test requests do not enter production.

## Tests

`node scripts/test-shop.mjs` checks API logic using an isolated SQLite database. `node node_modules/typescript/bin/tsc --noEmit` checks types.

## Hosting

Publish this full-stack app through Sites. The site remains private until its owner changes sharing. The source can live on GitHub, but GitHub Pages cannot execute this backend or persist orders. Do not replace the working shop with a static export.

Keep `.dev.vars`, `.env*`, generated builds, runtime state, and credentials out of version control. Production product and order data lives in D1, not in this repository.
