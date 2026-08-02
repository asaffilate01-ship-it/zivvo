# Zivvo production assurance v2

This release adds operational workflows and release controls across multiple independently reviewable files. It is additive to the first production upgrade.

## Included

- Private dealer lead queue with assignment, priority, follow-up dates and an immutable event history.
- Automatic reservation expiry with Stripe verification, idempotent refund requests, buyer notifications and a retryable failure state.
- Stripe handling for expired checkout, asynchronous failure, failed PaymentIntents, failed invoices and disputes.
- Admin payment operations panel for incidents, disputes and webhook failures.
- TOTP MFA setup for all users and mandatory AAL2 verification for administrators.
- Cloudflare Turnstile tokens on sign-in, registration and password recovery.
- File-signature validation, random object names, strict Storage ownership policies, MIME allowlists and size limits.
- Installable/offline-aware web app shell with update prompts. No authenticated API responses are cached.
- Reduced-motion, skip navigation and improved media-control accessibility.
- Unit tests, Playwright browser smoke tests, axe checks, CodeQL and dependency review.
- A minimal, rate-limited health endpoint suitable for uptime monitoring.

## Deployment order

1. Back up and restore a current database snapshot into staging.
2. Apply `20260802120000_production_assurance_v2.sql` in staging and run the RLS matrix.
3. Set `VITE_TURNSTILE_SITE_KEY`, configure the same Turnstile provider and secret in Supabase Auth, and verify all three auth journeys.
4. Deploy `contact-submit`, `expire-reservations`, `health-check`, `reservation-action`, `reserve-deposit` and `stripe-webhook`.
5. Schedule `expire-reservations` every five minutes with `X-Cron-Secret`; keep `close-auction` on its existing one-minute schedule.
6. Add all Stripe events listed in the runbook to the production webhook endpoint.
7. Deploy the exact tested frontend artifact, then exercise payment failure, expiry, dispute and recovery paths in staging.

The service worker deliberately caches only the public application shell and static same-origin assets. Supabase, Stripe and other cross-origin API responses are never cached.
