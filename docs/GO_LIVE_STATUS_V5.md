# Go-live status — v1.2.0-rc.1 phase 5

Updated: 2026-08-02

## What phase 5 closes

- Removes tracked `.env` and `.env.development` runtime files while retaining `.env.example`, and prevents future runtime environments and generated evidence from being committed.
- Pins React Router to the audited 6.30.4 client release. The production audit gate now has no high or critical finding; the two remaining moderate advisories affect open-redirect input and SSR hydration. Zivvo uses a client-only Vite build and sanitises stored navigation targets, but the advisory must remain in the dependency-risk register until an upstream fixed release is available.
- Adds accessible names and pressed/expanded state to password, theme, saved, inbox, notification and mobile navigation controls.
- Protects `close-auction` with POST-only handling, the constant-time cron-secret check, restricted CORS and safe errors. The Edge Function policy gate now verifies all 16 functions that disable gateway JWT verification have an explicit user, webhook, cron or rate-limited public policy.
- Adds separate staging and production environment contracts. Staging rejects live Stripe keys and the production domain; production rejects test Stripe keys and non-Zivvo domains.
- Adds immutable release metadata and per-file SHA-256 evidence, post-deploy frontend/header/backend verification, and GitHub Deployment success/failure records.
- Adds real Capacitor Android and iOS projects for `de.zivvo.app`, disables Android backups and cleartext traffic, enables verified Zivvo deep links, adds iOS associated domains and permission descriptions, and validates native identifiers/version/security in the main check.
- Adds Android lint/tests and unsigned iOS simulator builds to GitHub Actions. Native association files are generated only when real Apple and Android signing values are supplied.
- Expands browser acceptance to signup accessibility and release-critical public routes.

## Automated gates

From a clean checkout:

```bash
npm ci
npm run check
npm run audit:production
npm run test:e2e
npx cap sync
```

The **Release readiness** workflow must pass first for `staging`, then for `production`. Every deployed artifact must be verified with **Post-deploy verification** using its full commit SHA.

## Readiness after this phase

| Area | Repository readiness | External evidence still required |
|---|---:|---|
| Web application and UX | 90% | Staging browser/device acceptance and BFSG/WCAG review |
| Security engineering | 86% | Credential rotation, legacy Edge Function review and production monitoring |
| Backend and data | 78% | Staging restore, migration reconciliation, function deployment and RLS acceptance |
| Payments | 76% | Stripe test-mode matrix, webhook replay/refund/failure evidence and finance sign-off |
| Release engineering | 92% | Protected environments, branch rules, first readiness run and first deployment record |
| Native application code | 60% | Branded store assets, signing, push credentials, privacy declarations and device/store review |
| Legal and operations | 45% | Real operator details, counsel approval, PITR proof, on-call ownership and rollback rehearsal |

Code/repository readiness is approximately **90%**. Public commercial go-live remains approximately **80%** until the external evidence below is completed. Native store readiness is approximately **60%**.

## Gates code cannot complete

1. Rotate or restrict every value previously committed in `.env` history and configure protected GitHub `staging` and `production` Environments.
2. Protect `main` with required CI, Security and Native validation checks plus review requirements.
3. Restore a production-like backup into staging, reconcile all migrations, deploy the approved Edge Function list and configure the protected auction/reservation schedules.
4. Complete Stripe acceptance for subscriptions, reservations, deposits, winner payments, refunds, disputes, duplicate webhooks and failed/asynchronous payment paths.
5. Enter approved German company/legal values and obtain privacy, terms, auction/payment and BFSG accessibility sign-off.
6. Configure monitoring, alert destinations, backup/PITR evidence, incident ownership, RPO/RTO and a rehearsed frontend/database rollback.
7. For native release, provide Apple/Google signing identities, branded icons/screenshots, push configuration, truthful privacy/store declarations and real-device approval.

The release must not process live payments until every production gate has attached evidence and the production deployment is marked successful.
