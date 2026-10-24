# E-Commerce Website

A Next.js storefront with Sanity CMS catalog, persistent cart, Stripe Checkout, webhook-based order persistence, and ISR page generation.

## Stack

- **Next.js 12 / React 17** — storefront (ISR catalog & product pages)
- **Sanity (Studio v2, `sanity_ecommerce/`)** — products, banners, and orders
- **Stripe** — hosted Checkout + signed webhooks

## Getting started

```bash
npm ci --legacy-peer-deps
cp .env.example .env.local   # fill in your keys — see that file for details
npm run dev                  # http://localhost:3000
```

Sanity Studio:

```bash
cd sanity_ecommerce && npm ci --legacy-peer-deps && npm start   # http://localhost:3333
```

> The dataset is read publicly; the browser never receives a Sanity token.
> Server-side writes (orders from the Stripe webhook) use the server-only
> `SANITY_API_WRITE_TOKEN`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Unit tests (pure cart & order-mapping logic, `lib/*.test.mjs`) |
| `npm run lint` | ESLint (`next/core-web-vitals`) |

## How checkout works

1. The cart lives in React context (`context/StateContext.js`), with totals
   derived from items and persistence in `localStorage` (`ecommerce-cart-v1`).
2. `POST /api/stripe` accepts only product `_id`s + quantities and **re-prices
   from Sanity server-side** before creating the Stripe Checkout Session.
3. Stripe redirects payers to `/success?session_id=…` (verified server-side)
   or `/canceled`; the cart is preserved on cancel/unpaid.
4. `POST /api/stripe-webhook` verifies the Stripe signature and persist
   orders in Sanity (idempotently — order `_id` is the session id).

## Environment

See [`.env.example`](.env.example). Minimum: `NEXT_PUBLIC_SANITY_PROJECT_ID`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`. For orders in
production also set `STRIPE_WEBHOOK_SECRET` and `SANITY_API_WRITE_TOKEN`,
and register the webhook endpoint in the Stripe Dashboard.

## Project structure

```
components/   UI (Navbar, Cart, banners, Product)
context/      Cart state (React context over lib/cart.mjs)
lib/          Sanity/Stripe clients, pure cart & order logic + tests
pages/        Routes; pages/api has stripe checkout + stripe-webhook
sanity_ecommerce/  Sanity Studio (schemas: product, banner, order)
styles/       Global CSS
```

## License

MIT — see the repository owner for details.
