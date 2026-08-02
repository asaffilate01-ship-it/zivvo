# Phase 9 verification record

Date: 2026-08-02

## Passed locally

- Clean `npm ci --ignore-scripts`: 549 packages installed from the regenerated public-registry lockfile.
- Full and production-only dependency audits: zero high or critical findings; two moderate React Router advisories remain.
- `npm run check`: repository/workflow/public-claim/Edge/native policies, production configuration, release/smoke/SBOM/production-candidate/bundle contracts, TypeScript, ESLint, 25 Vitest tests and Vite 8.2.0 build passed.
- Workflow policy parsed all seven YAML files and verified 35 immutable action references.
- Bundle budget passed with 130 output files, 2,702,704 JavaScript bytes and a 374,147-byte largest chunk; no source maps were emitted.
- CycloneDX SBOM generation and lockfile-parity verification passed.
- Capacitor synchronization copied the build and five plugins successfully to both Android and iOS.
- `git diff --check` passed.

Local Playwright execution reached no application assertions because this environment does not contain the Playwright Chromium binary. All 12 attempts stopped at browser launch with the same missing-executable error. The previous GitHub `main` E2E job passed, and the Phase 9 SHA must be rerun on GitHub-hosted Chromium after upload. GitHub-hosted Android and iOS results are likewise authoritative for the new SHA.

## External verification still required

Complete `docs/GO_LIVE_EVIDENCE_REGISTER.md` for the exact production SHA. A locally green archive is not legal, payment, database, accessibility, monitoring, operational or store approval.
