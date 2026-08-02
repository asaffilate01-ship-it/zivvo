# Go-live status — v1.2.0-rc.2 phase 8

Updated: 2026-08-02

## Delivered in this phase

- Removes `.env` and `.env.development` from tracking while retaining safe templates and fail-closed ignore/repository-hygiene policy.
- Fixes the exact red iOS job: Capacitor 8.4.2 does not expose `SceneDelegateProxy`; the native scene lifecycle now forwards cold-start, URL-scheme and Universal Link activity through `ApplicationDelegateProxy`.
- Adds a native regression policy for the Capacitor 8 scene delegate and retains the Xcode result bundle on every simulator run.
- Upgrades Vite, Vitest, jsdom, TypeScript, the React build plugin and the lint toolchain, removing all high/critical development dependency advisories seen on the previous lockfile.
- Centralises server-provided payment redirects behind Stripe-only HTTPS validation, hardens external-window isolation and rejects encoded/double-encoded backslash or protocol-relative notification paths.
- Adds a protected production-candidate workflow that binds a production build to successful staging evidence for the exact commit and requires specific security, database, payments, legal, accessibility and operations evidence.
- Adds deterministic production-candidate, artifact-parity, staging-evidence and SBOM contracts to `npm run check`.

## Planning estimate after this phase

These figures measure repository readiness separately from evidence that must be produced in real services.

| Area | Readiness | Remaining proof |
|---|---:|---|
| Application features | 95% | Full real-role acceptance and defect burn-down |
| Web UI/UX | 95% | Real-device/browser acceptance and independent BFSG/WCAG review |
| Security engineering | 94% | Credential rotation/restriction, protected branch, accepted threat review and monitored production evidence |
| Backend/database | 82% | Migration reconciliation, restored staging backup, deployed functions/schedules and role/RLS results |
| Payments | 79% | Complete Stripe matrix, webhook replay/refund/failure evidence and finance reconciliation |
| Release engineering | 95% | Protected Environments plus retained successful staging, candidate and post-deploy runs |
| Native apps | 82% | Green macOS rerun, signing, push, real devices, store declarations and approvals |
| Legal/operations | 65% | Approved legal identity/content, accessibility sign-off, on-call, PITR and rollback rehearsal |

Code/repository readiness is approximately **98%** once the GitHub reruns are green. Commercial go-live readiness is approximately **87–89%** because the remaining work is largely real-service configuration, regulated approval and operational evidence. Native store readiness is approximately **82%**.

## What still prevents an honest 100%

1. Rotate/restrict the browser credentials that existed in Git history and confirm the intended Supabase and Stripe projects/accounts.
2. Protect `main`, create protected `staging` and `production` Environments, populate their variables/secrets/evidence links and require independent production approval.
3. Restore a production-like database backup into staging, reconcile/apply migrations, deploy Edge Functions and schedules, and retain role/RLS/PITR evidence.
4. Complete the Stripe subscription, reservation, inspection, auction, refund, dispute, async-failure, idempotency and webhook-replay matrix.
5. Obtain German marketplace/auction/payments/privacy and BFSG/WCAG approval against the final operator identity and UI.
6. Enable monitoring/alert routing, incident ownership, customer support escalation and rehearse frontend/database rollback.
7. Re-run GitHub CI and Native validation, then execute Release readiness, Staging acceptance, Production candidate gate and Post-deploy verification in that order.
8. For native scope, provide store signing and push credentials, real-device evidence, privacy/data-safety declarations and store approvals.

Domain/DNS work remains intentionally outside this phase. Do not enable live payments or public production claims until the production-candidate and post-deploy evidence are both successful for the released SHA.
