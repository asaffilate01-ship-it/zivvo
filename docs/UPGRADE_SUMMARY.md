# Zivvo production upgrade summary

Date: 1 August 2026

## Outcome

The application has been upgraded from a prototype-oriented marketplace to a production-candidate codebase. The code can be built and tested locally, but production release remains gated on real infrastructure secrets, legal operator details, migration rehearsal, monitoring, and acceptance testing.

## Material improvements

| Area | Upgrade |
| --- | --- |
| Payments | Server-owned EUR product catalogue, Stripe idempotency keys, verified webhook amounts/currency/metadata, replay ledger, real reservation refunds, guarded deposit/escrow updates |
| Auctions | Atomic bid and state-transition database functions, row locking, deposit eligibility, winner settlement, authenticated close-auction cron |
| Data access | Safe public views, reduced grants, role-scoped arbitrage view, protected inspection and document access, service-only counters |
| API security | Origin allowlist, consistent CORS, authentication/role checks, payload limits, anonymous and authenticated rate limits, UUID/URL validation |
| Credentials | DMS credentials encrypted at rest, stock-feed keys stored as hashes, secrets removed from tracked env files |
| Marketplace | Germany/EUR consistency, real comparable-based price guidance, dealer stock-feed validation, agent-created dealer invitations, truthful integration states |
| Privacy | Account-deletion flow, reduced public PII, consent-aware advertising, safer analytics loading, legal identity configuration gate |
| UI/UX | German default experience, honest finance/leasing estimators, clearer loading/error/empty states, responsive navigation and dashboards, lightweight WebP brand assets, route-level code splitting |
| Delivery | CI workflow, Dependabot, security headers, SPA routing configuration, production env validator, release runbook |

## Removed or disabled

- Prototype seed routes and test accounts
- UK-only DVLA, MOT, V5C, HPI, and VRM claims and flows
- Unverified portal syndication and Virtual Yard connectors
- Browser-written notification and payment state paths
- Hard-coded or fictitious partner, guarantee, review, performance, and market-data claims
- The build-time Lovable tagger and Lovable-specific server gateways

## Known release blockers

1. Supply and rotate real production credentials; any value previously committed must be treated as compromised.
2. Have German counsel approve Impressum, privacy, terms, cancellation, complaints, cookies, and the exact auction/reservation model.
3. Rehearse the hardening migration against a production-like database and inspect every warning.
4. Configure monitoring, alerting, backups/PITR, webhook failure handling, and an incident owner.
5. Complete accessibility, cross-browser, mobile, payment, role, and destructive-action acceptance tests.

## Dependency note

The currently published React Router release reports an advisory in its React Server Components action path. Zivvo is a client-only `BrowserRouter` SPA and does not use RSC or React Router server actions, so that code path is absent. Keep Dependabot enabled and upgrade as soon as an upstream patched release is available.
