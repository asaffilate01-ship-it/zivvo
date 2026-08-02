# GitHub go-live setup

This file describes repository controls that cannot be enabled by source code alone. Configure them before accepting a production release.

## 1. Rotate exposed browser credentials

The pre-phase-7 Git history contains browser configuration that should not be reused without review. Rotate the Google Maps browser key, restrict the replacement key to the exact staging and production HTTPS origins and only the required Maps APIs, and review the Supabase and Stripe publishable keys. Publishable keys are not server secrets, but they must point to the intended projects/accounts and rely on RLS, origin controls and server-side payment verification.

Do not paste replacement values into a commit, issue, Actions log or build archive. Rewriting Git history does not replace revocation or rotation.

## 2. Protect `main`

Create a ruleset for `main` that:

- requires a pull request and at least one approving review;
- dismisses stale approvals and requires CODEOWNERS review;
- blocks force pushes and branch deletion;
- requires conversation resolution;
- requires branches to be up to date;
- requires the CI `verify` and `e2e`, Security `CodeQL`, Native validation `Android test and lint`, and `iOS simulator build` checks;
- prevents bypass except for a documented break-glass owner.

Enable GitHub secret scanning with push protection, Dependabot alerts/security updates, private vulnerability reporting and CodeQL default setup or the checked-in CodeQL workflow. Keep Actions restricted to GitHub-owned or explicitly approved actions; the repository policy requires every action reference to use a full commit SHA.

Require the Security workflow's `Full dependency audit` check. It covers development and production dependencies at the high-severity threshold; `npm run audit:production` remains a separate runtime dependency gate.

## 3. Protected Environments

Create `staging` and `production` Environments. Require a reviewer for both and prevent self-review where the plan supports it. Restrict `production` deployments to `main`; add a wait timer if the operational change process requires one.

Populate the variables and secrets referenced by `.github/workflows/release-readiness.yml` and `.github/workflows/production-candidate.yml`. The real legal identity and monitored contact values belong in Environment variables, not source control. Browser keys that can be abused or billed remain Environment secrets even though their final values are visible in compiled JavaScript.

The `staging` Environment must additionally provide:

| Name | Type | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Variable | Staging Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Secret | Staging browser publishable key |
| `STAGING_E2E_USER_EMAIL` | Secret | Dedicated, non-privileged acceptance user |
| `STAGING_E2E_USER_PASSWORD` | Secret | Unique acceptance-user password |

The acceptance user must contain no real customer data, must not be an admin/agent/operator, and must be disabled or rotated after the release cycle. Never reuse its password elsewhere.

The protected `production` Environment must also provide direct HTTPS links to the approved evidence records below. Each link must identify a specific report, ticket, run or signed record rather than a generic home page.

| Name | Required evidence |
|---|---|
| `GO_LIVE_SECURITY_EVIDENCE_URL` | Threat review, key rotation/restriction and accepted security findings |
| `GO_LIVE_DATABASE_EVIDENCE_URL` | Migration reconciliation, role/RLS matrix, restored backup and PITR proof |
| `GO_LIVE_PAYMENTS_EVIDENCE_URL` | Stripe scenario, webhook replay, refund/failure and reconciliation results |
| `GO_LIVE_LEGAL_EVIDENCE_URL` | German operator, marketplace, auction, payments and privacy approval |
| `GO_LIVE_ACCESSIBILITY_EVIDENCE_URL` | BFSG/WCAG independent review and accepted remediation |
| `GO_LIVE_OPERATIONS_EVIDENCE_URL` | Monitoring, on-call, incident and rollback rehearsal |
| `GO_LIVE_NATIVE_EVIDENCE_URL` | Signing, real-device, privacy/data-safety and store evidence; required for `web-and-native` scope |

## 4. Required run order

1. Open a pull request and obtain green CI, Security and Native validation checks on its exact head SHA.
2. Merge through the protected branch; do not upload archives directly to `main`.
3. Run **Release readiness** for `staging`.
4. Deploy that immutable artifact to staging.
5. Run **Staging acceptance** with its full SHA, deployment origin and health URL. Retain the browser and smoke evidence.
6. Complete database, payment, privacy/legal, accessibility, monitoring, restore and rollback sign-off and set the production evidence variables above.
7. Run **Production candidate gate** with the accepted commit SHA, successful staging-acceptance run ID and approved scope. A protected `production` reviewer must approve the job.
8. Deploy only the `zivvo-production-candidate-<SHA>` artifact emitted by that gate.
9. Run **Post-deploy verification** and attach the successful GitHub Deployment link to the release record.

Zivvo uses Vite compile-time environment configuration, so staging and production artifacts are intentionally separate builds of the same immutable source SHA. The production gate binds the production build to the accepted staging SHA and re-runs every source/build/security contract. A later direct upload or different SHA invalidates the evidence and must restart this sequence.

Record every approval and retained artifact in `docs/GO_LIVE_EVIDENCE_REGISTER.md`. Do not place passwords, API keys, personal customer data or private legal advice in that public file; link to access-controlled records where appropriate.
