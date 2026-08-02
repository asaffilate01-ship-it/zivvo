# Go-live status — v1.2.0-rc.1 phase 7

Updated: 2026-08-02

## Confirmed GitHub issues closed by this phase

- Removes the still-tracked `.env.development` file and restores root, Android and iOS ignore contracts that were lost during the direct Phase 6 upload.
- Rebuilds `package-lock.json` from `package.json` using the public npm registry. A clean `npm ci` now succeeds instead of resolving an inconsistent Capacitor/Vite tree.
- Extends repository hygiene to reject tracked runtime/signing files, missing ignore contracts, stale root dependencies, non-public lockfile origins, missing integrity hashes and non-reproducible workflow installs.
- Restores the current Vite 8/Vitest 4/TypeScript toolchain and immutable Capacitor 8.4.2 core/platform/CLI/Swift-package versions.
- Adds deterministic CycloneDX 1.5 SBOM generation and verification directly from the committed lockfile; release artifacts now retain that SBOM.
- Adds protected staging acceptance against the deployed HTTPS origin, embedded release metadata, security headers, backend health and a dedicated non-privileged authenticated buyer journey.
- Adds exact GitHub branch, Environment, secret, run-order and credential-rotation instructions.

## Readiness estimate after phase 7

Percentages are planning estimates, not certification. Repository implementation and real-service evidence are measured separately.

| Area | Readiness | Evidence still required outside source control |
|---|---:|---|
| Web application and UX | 95% | Staging device/browser acceptance and independent BFSG/WCAG review |
| Security engineering | 94% | Key rotation/restriction, protected branch, GitHub security results, monitoring and accepted threat model |
| Backend and data | 80% | Migration reconciliation, restored staging backup, deployed functions, schedules and role/RLS acceptance |
| Payments | 76% | Complete Stripe test matrix, webhook replay/refund/failure evidence and finance approval |
| Release engineering | 97% | Protected Environments, required checks and retained green staging/production runs |
| Native application code | 78% | Signing, push credentials, store assets, real-device acceptance and store review |
| Legal and operations | 62% | Approved operator/legal text, accessibility sign-off, PITR proof, on-call and rollback rehearsal |

Code/repository readiness is approximately **96%**. Public commercial launch readiness is approximately **85%** until the protected workflows run successfully with approved real-service configuration and sign-off. Native store readiness is approximately **78%**.

## Mandatory external gates before live traffic or payments

1. Rotate/restrict the Google browser credential previously present in Git and review the Supabase/Stripe publishable-key configuration.
2. Protect `main`, configure `staging`/`production` Environments and run all required checks on the exact release SHA.
3. Restore a production-like backup into staging, reconcile migrations, deploy Edge Functions and schedules, and retain role/RLS and restore evidence.
4. Pass subscription, reservation, inspection, auction, refund, dispute, asynchronous-failure and webhook-replay scenarios in Stripe staging/test mode.
5. Obtain German legal/privacy/payments/auction and BFSG/WCAG approval using the real operator and monitored contact values.
6. Enable production monitoring, alert routing, incident ownership, RPO/RTO, PITR and a rehearsed frontend/database rollback.
7. Provide iOS/Android signing, push configuration, privacy/data-safety declarations, real-device evidence and store approvals.

Domain/DNS work is intentionally outside this phase. Do not enable live payments or advertise production availability until every gate has a named owner and linked evidence.
