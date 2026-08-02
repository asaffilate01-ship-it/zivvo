# Go-live status — v1.2.0-rc.1

Updated: 2026-08-02

## Automated release gates

| Gate | Status | Evidence |
| --- | --- | --- |
| Immutable install | Pass | `npm ci` completes with the committed lockfile |
| TypeScript | Pass | `npm run typecheck` |
| Lint | Pass | `npm run lint` with zero errors and zero warnings |
| Unit/contract tests | Pass | 10 tests, including payment amount/currency tampering |
| Production bundle | Pass | `npm run build` |
| High/critical dependency audit | Pass | `npm run audit:production` |
| Browser test discovery | Pass | Six Chromium/mobile scenarios are registered |
| Production configuration | Blocked as designed | `npm run build:production` rejects missing live/legal values |

The remaining two `npm audit` findings are moderate React Router advisories with no patched
release in the supported line. Zivvo is a client-rendered SPA and does not use React Router SSR or
RSC hydration. Keep this risk recorded and upgrade when an upstream fix is published.

## Completed in v3

- Server-owned EUR catalogues for dealer subscriptions, boosts, inspections, reservations and
  auction deposits; client-supplied prices and redirect URLs are ignored.
- Stripe checkout metadata, exact amount/currency verification, idempotency and retry-safe auction
  settlement.
- Stripe verification before an auction deposit becomes authorized; stale authorizations are not
  reused.
- Removed the browser-created finance authorization. The verified finance request workflow remains
  available; the unfinished bypass is no longer presented as a working payment method.
- Rate-limited contact, dealer lead and newsletter endpoints wired to all public forms.
- Fixed €500 reservation and auction-deposit UX, with consistent German/EUR display.
- Germany-first canonical URLs, social metadata, geo tags and a fixed-origin sitemap.
- Production environment validation now loads standard environment files and supports the existing
  Lovable connector aliases.
- Browser environment files removed from Git tracking and covered by `.gitignore`.
- Database constraints for EUR card authorizations, captured amounts and duplicate pending
  inspection checkouts.

## Release-blocking external work

1. Rotate every key that has ever been committed, configure referrer restrictions, and decide
   whether repository history must be rewritten under the organization security policy.
2. Fill all real `VITE_LEGAL_*` values and obtain German legal/privacy/BFSG approval.
3. Configure live Stripe connector credentials, webhook secret and a €49.99 monthly Price with
   lookup key `price_de_dealer_pro`; run every payment/refund/replay scenario in staging.
4. Back up staging, apply all migrations through `20260802160000_go_live_p0_v3.sql`, and confirm the
   intentional re-authorization of legacy auction deposits.
5. Deploy the changed Edge Functions and schedules from `PRODUCTION_RUNBOOK.md`.
6. Run the full Playwright suite against staging, including real authentication and Stripe test-mode
   acceptance. Test discovery alone is not launch acceptance.
7. Enable branch protection, required CI/CodeQL checks, secret scanning, dependency updates and
   signed release tags on `main`.
8. Configure production error/payment monitoring, alert routing, verified backups/PITR, incident
   ownership and rollback rehearsal.
9. Sign off product, payments, support, security, privacy/legal and operations before DNS promotion.

## Migration warning

The v3 migration expires all pre-existing `pending` and `authorized` auction deposits. Their legacy
currency contract cannot be proven, so bidders must safely authorize a new €500 hold after rollout.
