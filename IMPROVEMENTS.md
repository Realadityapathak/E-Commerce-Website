# Improvements — what changed, why, and what was deliberately NOT changed

Guiding rule: **evolution, not rewrite.** Routes, CSS class names, Sanity
document types, the context API consumed by components, and the checkout
request/response shape are unchanged, so every change below is independently
revertible and the site looks/behaves the same on the happy path.

## ✅ Done

### Money path (`pages/api/stripe.js`, `components/Cart.jsx`)
- **Server-authoritative pricing.** The client still sends the same cart
  payload, but the server only trusts `_id` + `quantity`. Name, price and
  image are re-fetched from Sanity. Previously anyone could POST
  `price: 1` and pay ₹1 for anything.
- **Validation before Stripe:** non-array/empty carts, bad quantities,
  unknown product IDs, and >50 distinct items are rejected with `400`
  and a generic message. Real errors are logged server-side only
  (previously `err.message` leaked provider internals to browsers).
- **`Math.round(price * 100)`** — fixes `19.99 * 100 = 1998.99…` being
  rejected by Stripe. Quantities are merged per product and capped.
- **Config instead of magic values (with fallbacks, so nothing changes
  until you set them):** `STRIPE_SHIPPING_RATE_ID` (fallback: previous
  hardcoded rate), `NEXT_PUBLIC_BASE_URL` (fallback: request origin) for
  success/cancel URLs. `success_url` now carries `session_id` for future
  verification.
- **Checkout UX failures are visible:** fixed the dead
  `response.statusCode` check (fetch uses `.ok`/`.status`), added
  try/catch, error toast, and a disabled/loading Pay button against
  double-submits.
- **`/canceled` page created** — Stripe's `cancel_url` previously 404'd.
  The cart is intentionally preserved there.

### Cart correctness (`lib/cart.mjs`, `context/StateContext.js`)
- Extracted pure, test-covered cart logic (`lib/cart.mjs` + 12 tests in
  `lib/cart.test.mjs`, run with `npm test` — no new dependencies):
  - **Fixed cart corruption:** re-adding a non-first item produced
    `undefined` entries (A, B, A-again crashed the drawer).
  - **No prop mutation** (`product.quantity = …` removed).
  - **Order preserved** on quantity +/− (was filter+append reordering).
  - **Totals are derived** from items via `useMemo` instead of being
    hand-synced in three places.
  - Toast now announces the quantity actually added, not the page `qty`.
- **Cart persistence:** versioned `localStorage` key `ecommerce-cart-v1`,
  hydrated client-only after mount, validated on load, fully guarded so
  blocked/corrupt storage can never break the shop.
- Context API is backward compatible: `toggleCartItemQuanitity`
  (misspelled) remains as an alias of the new correctly-spelled
  `toggleCartItemQuantity`; `setTotalPrice`/`setTotalQuantities` remain as
  no-ops (totals are derived now); a new `clearCart()` is the preferred API.
- `/success` uses `clearCart()` instead of `localStorage.clear()`, which
  wiped every key on the origin.

### Resilience & security
- **Browser Sanity client no longer carries a token.** `NEXT_PUBLIC_*`
  vars are public; if that token had write access, anyone could edit the
  catalog. Server-side fetches use `serverClient` with the server-only
  `SANITY_API_TOKEN` (only needed for private datasets). **Action for the
  site owner:** if the old token had write access, rotate it in
  Sanity Manage → API → Tokens.
- **GROQ injection closed:** product query is parameterized (`$slug`).
- **Unknown product slug → 404** (`notFound: true`) instead of a 500;
  products without slugs are skipped in `getStaticPaths`; a Sanity outage
  during build no longer fails the deploy (`fallback: 'blocking'`).
- **Missing CMS content no longer crashes the homepage:** `HeroBanner`,
  `FooterBanner`, and `Product` guard against missing banners/images/slugs.
- **Sanity product schema validation:** `name`, `slug`, `price`, `image`
  are now required and `price >= 0` for *future* publishes. Existing valid
  documents are unaffected.

### Performance
- Homepage: `getServerSideProps` → `getStaticProps` + ISR (`revalidate: 60`)
  with parallel fetches and graceful fallback — Sanity is no longer hit on
  every request. Product pages gained `revalidate: 60`, so price edits no
  longer require a redeploy.
- `next.config.js` allows `cdn.sanity.io` images (prep for a future,
  one-component-at-a-time `next/image` migration; not done yet — see below).

### Accessibility (same visuals)
- Quantity controls are real `<button>`s with `aria-label`s in the cart and
  on product pages (were clickable `<span>`s); cart remove button labelled;
  `alt` text added to product/cart/banner images. A small CSS rule keeps
  buttons pixel-identical to the old spans, with a visible focus state.

### Developer experience
- **Fixed ESLint config** (`next/babel` isn't an ESLint config — lint
  couldn't run at all) → `next/core-web-vitals`; fixed the two resulting
  `no-unescaped-entities` errors. `npm run lint` now passes (0 errors;
  `<img>`/`passHref` warnings remain by design, see below).
- `.env.example`, `engines: node >=16`, `npm test` script, and a GitHub
  Actions workflow (install → test → lint). Build is not in CI yet because
  static generation needs live Sanity credentials/secrets.

## 🚫 Deliberately NOT done (would risk breaking the site)
- **No framework upgrades** (Next 12→14, React 17→18, Sanity Studio v2→v3,
  Stripe SDK bump). All are EOL pressure, not malfunctions; each deserves
  its own PR/quarter, one major at a time, after the money path is stable.
- **No `next/image` migration yet** — config is ready; migrate one component
  per PR with visual diffs (banners last, highest CLS risk).
- **No state-library (Redux/Zustand), Tailwind, or TypeScript rewrite.**
  Context + global CSS is fine at this scale; big-bang rewrites have zero
  user value and maximum regression surface.
- **No checkout redesign, order system, or webhook enforcement yet.**
  `success_url` already carries `session_id`; next step is a Stripe webhook
  + `order` schema (fully additive), then verify sessions on `/success`.
- **No lockfile deletions / `.babelrc` removal / folder restructure** in
  this pass. Each belongs in its own pure-hygiene PR so diffs stay
  reviewable. (`.babelrc` removal re-enables SWC — test builds carefully.)
- **Fake review stars "(20)" left in place** on the product page — removing
  them is a product/trust decision for the owner, not an engineering fix.

## Verification performed
- `npm test` — 12/12 cart unit tests pass (incl. the A-B-A regression).
- `npm run lint` — 0 errors (previously failed to load config at all).
- `npm run build` — succeeds; `/` is ISR, `/canceled` exists,
  `/api/stripe` compiles. (In this sandbox Sanity's CDN is unreachable, so
  static pages generated empty catalogs — exactly the graceful path the
  new fallbacks are designed for.)
- Live smoke test: `/`, `/canceled`, `/success` → 200; checkout API rejects
  empty/non-array/bad-quantity payloads with 400 JSON, GET → 405,
  tampered-price payload no longer influences pricing (server lookup).

## ✅ Phase 2 (done)

### Order persistence + Stripe webhook
- New Sanity `order` type (registered in the Studio schema). Orders are
  snapshots — name/price/quantity at purchase time — created only by the
  webhook, read-only in Studio. Studio must be redeployed for it to appear.
- `pages/api/stripe-webhook.js`: raw-body signature verification
  (`STRIPE_WEBHOOK_SECRET`), handles `checkout.session.completed`,
  `async_payment_succeeded`/`failed`, and `expired`. Unconfigured secrets
  return 500 (Stripe retries) instead of silently dropping orders;
  bad signatures return 400 and persist nothing.
- Mapping lives in pure, tested `lib/order.mjs` (7 tests). Deterministic
  `_id` (`order.<sessionId>`) + patch-on-replay makes Stripe's
  at-least-once delivery idempotent, and a paid order is never downgraded
  by a late event. Checkout line items now carry `metadata.productId` so
  orders link back to Sanity products.
- Requires `SANITY_API_WRITE_TOKEN` (write access) server-side.

### `/success` payment verification (soft enforcement)
- `getServerSideProps` retrieves the Checkout Session when `session_id`
  is present. Confirmed paid → "Payment confirmed", cart cleared.
  Definitively unpaid → no fake thank-you, **cart preserved** for retry.
  Verification unavailable (missing key, Stripe/network error) or no
  session id → previous behaviour. The webhook + order record remains
  the source of truth; this page is a UX layer over it.

### `next/image` (fixed-size images only)
- Migrated: product cards (250×250), cart thumbnails (180×150), product
  detail (400×400) + gallery thumbs (70×70) — all had known dimensions
  in CSS. **Banners intentionally remain `<img>`**: their fluid/absolute
  layout makes them the highest visual-regression risk, and they were
  last in the staged plan. Migrate them separately with a visual diff.

## Owner checklist after merging
1. Set `NEXT_PUBLIC_BASE_URL`, `STRIPE_SHIPPING_RATE_ID`,
   `STRIPE_WEBHOOK_SECRET`, and `SANITY_API_WRITE_TOKEN` in Vercel, and
   create the webhook endpoint in the Stripe Dashboard pointing at
   `/api/stripe-webhook`.
2. Redeploy Sanity Studio so the `order` type appears.
3. Rotate the old Sanity token if it had write permissions. ⚠️ This and
   a live Stripe test-mode purchase require **your Stripe/Sanity account
   access** — they cannot be done from the codebase alone, and no
   credentials should ever be pasted into chat/PRs.
4. Run one Stripe **test-mode** purchase end-to-end (success + cancel)
   and confirm an `order` document appears in Studio.
5. Remaining planned work: banner `next/image` migration (with visual
   diff) → one-at-a-time dependency upgrades (Next/React/Sanity/Stripe
   majors are each their own project, not one sweep).
