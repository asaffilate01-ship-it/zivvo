# Zivvo production runbook

This is the release checklist for `zivvo.de`. A checked-in build is not approval to publish. The release owner must record evidence for every gate.

## 1. Ownership and legal gates

- Replace every `VITE_LEGAL_*` value with the actual operator identity and have German counsel approve all legal pages.
- Confirm controller/processor roles, retention schedules, data-subject workflows, subprocessors, DPAs/AVVs, cookie consent, advertising consent, and international transfers.
- Have counsel approve auction, reservation, deposits, escrow wording, buyer premiums, refunds, cancellation rights, dealer verification, and commission terms.
- Perform a documented BFSG/WCAG accessibility review, including keyboard-only, screen-reader, zoom, contrast, form errors, dialogs, tables, charts, and payment flows.
- Set named owners for security, privacy, payments, customer support, incidents, and release rollback.

## 2. Rotate and configure credentials

Treat any credential that previously appeared in Git history as compromised. Rotate it before release. If required by policy, rewrite repository history and invalidate every old value.

Set the browser variables from `.env.example` in the hosting platform. Restrict the Google browser key by production/staging HTTP referrer and API. Use a Supabase publishable/anon key only—never the service-role key.

Set Edge Function secrets:

```bash
supabase secrets set \
  APP_URL=https://zivvo.de \
  ALLOWED_ORIGINS=https://zivvo.de,https://www.zivvo.de \
  SUPABASE_URL=https://PROJECT.supabase.co \
  SUPABASE_ANON_KEY=REDACTED \
  SUPABASE_SERVICE_ROLE_KEY=REDACTED \
  STRIPE_LIVE_API_KEY=REDACTED_CONNECTOR_KEY \
  LOVABLE_API_KEY=REDACTED \
  PAYMENTS_LIVE_WEBHOOK_SECRET=whsec_REDACTED \
  CRON_SECRET=REDACTED \
  DMS_CREDENTIAL_ENCRYPTION_KEY=REDACTED \
  GOOGLE_MAPS_API_KEY=REDACTED \
  AI_API_URL=https://provider.example/v1/chat/completions \
  AI_API_KEY=REDACTED \
  AI_MODEL=REDACTED
```

Use a cryptographically random DMS key and cron secret of at least 32 bytes. Restrict the server Maps key to the Geocoding API and the intended server environment. The AI endpoint must be HTTPS and OpenAI-compatible; approve its DPA and data-retention settings before enabling it.

In Supabase Auth, require verified email, a minimum 12-character password, leaked-password protection, production redirect allowlists, rate limits, and MFA for every privileged operator. Disable unused identity providers and test account recovery before launch.

## 3. Database migration

1. Take a verified backup and confirm point-in-time recovery.
2. Restore a recent production-like snapshot into staging.
3. Review and apply `supabase/migrations/20260801170000_production_security_hardening.sql`, `supabase/migrations/20260802120000_production_assurance_v2.sql`, then `supabase/migrations/20260802160000_go_live_p0_v3.sql` in staging.
4. Confirm there are no duplicate active reservations or conflicting idempotency rows before unique indexes are created.
5. Test every role against the new views, grants, RLS policies, and security-definer functions.
6. Inspect query plans and locks for bidding, auction close, stock ingestion, and analytics.
7. Apply the migration during an approved window, monitor locks/errors, and retain the backup until acceptance completes.

Never run a migration against production first. The v3 migration intentionally expires pre-existing pending/authorized auction deposits because their original currency contract cannot be proven; staging acceptance must confirm bidders are prompted to re-authorize €500. The migrations narrow grants and change workflows, so rolling back application code without rolling back the database may not restore compatibility.

## 4. Edge Functions and scheduled work

Deploy the tracked functions only:

```bash
for function in ad-campaigns ai-chat arbitrage-payment boost-checkout check-subscription close-auction confirm-deposit contact-submit create-checkout customer-portal delete-account deposit-checkout expire-reservations generate-description generate-inspection-pdf geocode health-check inspection-checkout invite-dealer newsletter-subscribe nhtsa-vin-decode notify-arbitrage price-check reservation-action reserve-deposit reverse-geocode send-notification-email sitemap stock-ingest stripe-webhook syndicate-listing virtualyard-sync winner-payment; do
  supabase functions deploy "$function"
done
```

Configure `close-auction` to run every minute with `X-Cron-Secret: <CRON_SECRET>`. Do not place the cron secret in a URL. Confirm the public functions in `supabase/config.toml` still perform their own rate limit and signature/secret checks.

Configure `expire-reservations` every five minutes with the same protected header. Point uptime monitoring at `health-check`; alert on non-2xx responses without placing credentials in the URL.

If the Supabase project changes, update `VITE_SUPABASE_PROJECT_ID` and the sitemap URL in `public/robots.txt`.

## 5. Stripe

- Create one live recurring EUR dealer price with the Stripe lookup key `price_de_dealer_pro`. The application resolves the current live Price ID from that lookup key; do not expose a secret or hard-code a generated Price ID in the browser.
- Register the production webhook URL for `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `payment_intent.payment_failed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.trial_will_end`, `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`, `charge.dispute.funds_withdrawn`, `charge.dispute.funds_reinstated`, `refund.created`, `refund.updated`, `refund.failed`, and `charge.refund.updated`.
- Verify Stripe signatures, replay handling, expected amount/currency checks, and duplicate delivery behavior in staging.
- Exercise subscription checkout/portal, listing boosts, reservations, inspection checkout, auction deposits, winner payment, and arbitrage payment.
- Reconcile the Stripe dashboard, webhook ledger, payment ledger, database state, refunds, and failure states before accepting money.

## 6. Build and release

Use Node.js 22 and an immutable lockfile install:

```bash
npm ci
npm run check
npm run audit:production
npm run build:production
```

`build:production` must pass using the hosting environment's real values. Publish the generated `dist/` directory with `public/_headers` and `public/_redirects`, or use `vercel.json`. Confirm that the Content Security Policy is present on the actual response, HTTPS redirects are active, and `index.html` is not cached.

Deploy to staging, complete acceptance, then promote the exact same artifact to production. Do not rebuild between approval and promotion.

## 7. Acceptance matrix

Test desktop and current iOS/Android browsers at minimum:

- Anonymous: home, browse/filter/map, dealer page, car/auction detail, newsletter, price guidance, consent choices, legal pages, invalid/deep URLs.
- Buyer/seller: sign-up/sign-in/reset, saved cars/searches, enquiry/inbox, create/edit/delete listing, reservation, account deletion.
- Dealer: invite activation, subscription/portal, inventory, CSV/XML/JSON stock feed, landing-page editor, enquiries, costs, reservations.
- Agent: authorised invite, duplicate invite, dealer pipeline, commission visibility boundaries.
- Inspector: assignment boundary, checklist, photo/report access, repeat submission, payout visibility.
- Auction: deposit, concurrent bids, minimum increment, own-auction rejection, close, winner/loser state, full payment, refund/failure paths.
- Admin: role checks, verification documents, campaign URLs, auction review, arbitrage transitions, exports, audit log.
- Security: CORS rejection, rate limits, idempotent retries, direct-table permission denial, signed URL expiry, CSP, webhook spoof/replay rejection.

## 8. Operations and rollback

- Enable Supabase database, auth, Edge Function, and Stripe webhook alerts; send errors to an approved monitoring provider with PII scrubbing.
- Alert on payment verification failures, auction-close failures, webhook backlog, elevated 4xx/5xx rates, stock-feed abuse, auth anomalies, and backup failures.
- Document RPO/RTO, incident severity, on-call contacts, processor notifications, and the GDPR breach-assessment workflow.
- Roll back the frontend by promoting the previous immutable artifact. Pause affected payment/scheduled flows before a database rollback. Database rollback requires a reviewed migration or restore—not an ad-hoc destructive command.

## 9. Go-live sign-off

Release only when product, engineering, security, privacy/legal, payments, support, and operations owners have signed the checklist and no severity-1 or severity-2 issue remains open.
