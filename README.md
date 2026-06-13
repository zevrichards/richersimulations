# Richer Simulations

The e-commerce platform for [Richer Simulations](https://richersimulations.com) — a React web application for selling X-Plane, MSFS and Prepar3D airport scenery packages. Built manually, with a subsequent AI-assisted refactor of the order fulfilment system.

## What it does

- Product catalogue with scenery package listings and preview images
- Shopping cart with persistent state across sessions
- PayPal payment integration
- Fygaro payment integration (local TTD payments via JWT-signed requests)
- Firebase Authentication — email/password, Google sign-in, anonymous cart preservation
- Anonymous-to-authenticated UID migration (cart items preserved on sign-in)
- Digital product delivery via secure download links post-purchase
- Order history per user
- FAQ and Data Deletion pages
- Server-side order fulfilment via Firebase Cloud Functions

## Tech stack

- React (Create React App)
- Firebase — Firestore, Authentication, Cloud Functions, Hosting
- PayPal JS SDK
- Fygaro payment integration
- Material UI (dark theme)
- react-router-dom v5

## AI-assisted changes

The original site was built manually. A later refactor of the order fulfilment system was completed with AI assistance. Specific changes made during that refactor:

- Migrated order fulfilment from client-side logic to server-side Firebase Cloud Functions (`completeOrder`, `fygaroWebhook`, `paypalWebhook`, `manualOrderComplete`)
- Added idempotency to webhook handlers — orders already marked `Completed` are silently skipped on retry
- Fixed anonymous→Google UID orphaning: cart items are now migrated to the authenticated UID on sign-in
- Fixed stale order number reference bug in the PayPal flow
- Added missing `await` keywords in async fulfilment logic
- Fixed `custom_id` omission in PayPal order creation (required for webhook order matching)
- Added `manualOrderComplete` admin Cloud Function for manual order recovery
- Fixed promo code update bug (`pendingOrderRef.PromoCode` → `pendingOrder.PromoCode`)
- Replaced `batch.delete` on PendingOrders with a `Completed` status flag for audit trail
- Added self-heal: creates missing `Users/{uid}` Firestore docs on the fly if absent


## Running locally

```bash
npm install
npm start
```

Requires a Firebase project configured in `src/config/config.js` and a `.env` file with the appropriate environment variables. Cloud Functions require secrets configured via Firebase Secret Manager.
