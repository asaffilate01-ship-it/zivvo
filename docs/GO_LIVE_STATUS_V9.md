# Go-live status — v1.2.0-rc.3 phase 9

Updated: 2026-08-02

## Delivered

- Removes `.env` and `.env.development` from the repository so the fail-closed hygiene gate can pass on GitHub.
- Replaces the omitted Vite 5/SWC, Vitest 3 and jsdom 20 toolchain with Vite 8.2.0, the React 6.0.5 plugin, Vitest 4.1.10, jsdom 29.1.1, TypeScript 5.9.3 and the current ESLint 9 toolchain.
- Reduces the current dependency audit from 32 findings, including 1 critical and 11 high, to two known moderate React Router findings and no high or critical findings.
- Adds a mandatory full dependency audit job to the Security workflow so development supply-chain risk is release-visible.
- Adds deterministic production bundle budgets for HTML, CSS, individual JavaScript chunks, total JavaScript and source-map exclusion.
- Adds a go-live evidence register covering repository, credentials, database, Edge Functions, Stripe, legal/privacy, accessibility, monitoring, operations, domain/email, native and post-deployment sign-off.

## Planning estimate after GitHub verification

| Area | Readiness | Remaining proof |
|---|---:|---|
| Application features | 95% | Full real-role staging acceptance and defect burn-down |
| Web UI/UX | 95% | Real browser/device performance and independent BFSG/WCAG approval |
| Repository/code | 99% | Green hosted CI on the Phase 9 SHA and protected-branch enforcement |
| Security engineering | 96% | Key rotation/restriction, threat sign-off and monitored production evidence |
| Backend/database | 82% | Migration reconciliation, restored staging backup, deployed functions/schedules and role/RLS evidence |
| Payments | 79% | Complete live-mode Stripe matrix, webhook replay/refund/failure evidence and reconciliation |
| Release engineering | 96% | Protected Environments plus successful staging, candidate and post-deploy runs |
| Native apps | 84% | Signing, push, real devices, declarations and store approvals |
| Legal/operations | 68% | Final German approvals, accessibility, monitored on-call, PITR and rollback rehearsal |

Repository readiness should reach approximately **99%** once CI, Security and Native are green for the uploaded Phase 9 SHA. Overall commercial go-live readiness is approximately **90–92%** after those hosted checks; it cannot honestly be 100% until the real-service evidence register is complete.

## Remaining route to 100%

1. Upload Phase 9 through a reviewed pull request; confirm CI, E2E, full dependency audit, CodeQL, Android and iOS all pass on the same SHA.
2. Rotate/restrict the previously committed browser credential and protect `main`, `staging` and `production`.
3. Execute Release readiness, deploy staging, then execute authenticated Staging acceptance.
4. Complete database restore/migration/RLS/PITR and Edge Function/schedule evidence.
5. Complete Stripe success, failure, asynchronous, replay, refund, dispute and finance reconciliation evidence.
6. Obtain final German legal/privacy and independent BFSG/WCAG approvals.
7. Test monitoring, support escalation, incident ownership, email authentication and rollback/restore.
8. Run the protected Production candidate gate, deploy only its artifact, run Post-deploy verification and create the release/tag.
9. For native launch, finish signing, push, real-device, store-data declarations and store approvals.
