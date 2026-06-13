# richersimulations fix — anon→Google sign-in + webhook hardening

## What's in this zip

Five files, with the exact paths they belong at in your repo:

- `src/utils/browserDetect.js` — **NEW FILE** (in-app browser detection + open-in-browser URL builder)
- `src/components/SignIn.js` — updated
- `src/components/Cart.js` — updated
- `src/App.js` — updated
- `functions/index.js` — updated

## How to apply

Drop the zip contents over the root of your `richersimulations` repo — the
paths mirror your project layout, so there are no manual moves. All four
updated files simply overwrite their existing counterparts; the one new
file (`src/utils/browserDetect.js`) creates a new `src/utils/` folder if
you don't already have one.

## What changed and why

### Primary bug (the one that broke Aldrich's order)

Anonymous users who clicked "Sign in with Google" in `SignIn.js` were
being sent through `auth.signInWithRedirect(googleProvider)`, which
**creates a new Firebase user** rather than linking Google onto the
anonymous account. Result: the user's cart and pending order, both
written under the anonymous UID, were orphaned. The Fygaro webhook
then tried to look up the *new* Google UID, found no Firestore doc
for it, and threw `User not found`.

Fixed in `SignIn.js` by:
- Calling `currentUser.linkWithRedirect(googleProvider)` when the
  current user is anonymous, so the UID is preserved and the cart
  carries over automatically.
- Falling back to regular sign-in + cart migration when the Google
  account already exists (`auth/credential-already-in-use`). The anon
  UID gets stashed in `sessionStorage.pendingAnonMerge`, and `App.js`
  picks it up after the redirect returns to migrate the cart.

`App.js` also now upserts `Users/{uid}` on every non-anonymous auth
state change (with `{merge: true}`), so even orphaned Google users
from *before* this fix will at least have a Firestore doc the next
time they visit the site.

### Stale orderNumber bug in Cart.js

`handleSendToPaymentPlatform` was reading `this.state.orderNumber`
**before** calling `createPendingOrder()`, which then generated a new
orderNumber and set it into state. The JWT sent to Fygaro used the
*stale* orderNumber (empty on first checkout, previous order on
subsequent ones), while `PendingOrders/{orderNumber}` was written
with the *new* one. Result: `Order not found: 1776638322`.

Fixed by having `createPendingOrder()` return the generated orderNumber
directly, so the caller doesn't depend on async state. Also added the
missing `await` on `batch.commit()` — without it, the user could be
redirected to Fygaro before the order items finished writing.

### In-app browsers

Google sign-in in Instagram/Facebook/TikTok webviews is unreliable —
popups are usually blocked and redirects can silently fail. Added
`src/utils/browserDetect.js` with `isInAppBrowser()` detection and a
`buildOpenInBrowserUrl()` that constructs `intent://` (Android) or
`x-safari-https://` (iOS) URLs.

`SignIn.js` now shows a friendly yellow panel explaining the situation
when an in-app browser is detected, with a "Try to open in my browser"
button that attempts the OS-specific deep-link. Users can also still
use email/password login, which works fine inside in-app browsers.

### Popup vs redirect

Because the repo doesn't separate dev/prod builds, popup is still used
when `window.location.hostname === 'localhost'` (redirect is painful
to test against localhost OAuth consent screens). On any deployed
hostname, redirect is used.

### Server-side (`functions/index.js`)

`fulfillOrder` was rewritten:

- **Idempotency.** Payment providers retry failed webhooks. Your
  logs show order `1776638322` getting retried at 18:41, 19:20, and
  23:00. Without idempotency, if the first attempt partially
  succeeded (batch committed but email queue failed, say), each
  retry would re-credit FileIDs, re-decrement the promo count, and
  re-send the email. Now `fulfillOrder` checks
  `pendingOrder.status === "Completed"` at the top and returns
  cleanly if so.

- **No more `batch.delete(pendingRef)`.** The `PendingOrders` doc is
  marked Completed instead of deleted. This is what makes the above
  idempotency check possible, and gives you a permanent audit trail
  of every payment. If the collection grows too large over time, add
  a scheduled function that prunes completed entries older than N
  days.

- **Self-heal missing user doc.** If `Users/{userId}` doesn't exist
  (Google-orphan case), the webhook now reads the email from
  `PendingOrders.email` and/or Firebase Auth, creates the user doc on
  the fly with `createdBy: "webhookSelfHeal"`, and continues. The
  client fix above prevents new orphans, but this makes the server
  resilient against any that slipped through before the fix shipped.

- **Promo code bug fixed.** Old code read `pendingOrderRef.PromoCode`
  — `pendingOrderRef` is a `DocumentReference`, not data, so that
  property was always `undefined`. Any order with a promo code was
  silently not decrementing the code's quantity. Now reads
  `pendingOrder.PromoCode` from the actual document data.

- **Redundant check removed.** The old "Orders empty, skipping
  fulfillment" check queried the user's *entire* Orders sub-collection
  and threw if empty. This was redundant (the PendingOrders check
  above already proves the order exists) and would spuriously throw
  for any first-time or migrated user. Removed; replaced with a
  targeted existence check on the specific Orders/{orderNumber} doc.

## Recovering Aldrich's failed order

This deploy alone won't retroactively fulfill the failed order. To
recover it manually:

1. In Firestore, open `PendingOrders/1776638322` (or whatever the
   affected orderNumber was) and read its `userId` and `email`.
2. Create `Users/{userId}` manually with `{ UID, email, name }` —
   or just trigger any non-anon sign-in from that account in the
   updated site, which will auto-create the doc via the new
   `App.js` effect.
3. Ask Fygaro to re-deliver the webhook for that transaction (from
   their dashboard). With both the user doc and the updated webhook
   in place, fulfillment will complete normally and the receipt
   email will go out.

Alternatively, once the user doc exists, invoke `manualOrderComplete`
with the order number — same effect.

## Suggested commit message

```
Fix anonymous→Google sign-in orphaning orders; harden webhook

Client:
- Link anonymous user to Google credential on sign-in instead of
  creating a new orphaned account. On 'credential-already-in-use',
  sign in to existing Google user and migrate cart from anon UID
  via sessionStorage handoff.
- Detect Instagram/Facebook/TikTok in-app browsers and show guidance
  + attempt intent:// / x-safari-https:// redirect to system browser.
- App.js: upsert Users/{uid} doc on every non-anon auth state change,
  and run anon cart migration if pendingAnonMerge is set.
- Cart.js: createPendingOrder now awaits batch.commit() and returns
  the orderNumber; handleSendToPaymentPlatform uses the returned
  value instead of stale this.state.orderNumber.

Server (functions/index.js):
- fulfillOrder: idempotency via status=="Completed" check (stop
  double-processing Fygaro retries).
- Mark PendingOrders Completed instead of deleting; keeps audit trail
  and makes idempotency possible.
- Self-heal missing Firestore user doc from Firebase Auth record.
- Fix promo code bug: was reading pendingOrderRef.PromoCode (undefined
  property on DocumentReference) instead of pendingOrder.PromoCode.
- Remove redundant "user Orders empty" check that would spuriously
  throw for first-time or migrated users.
```
