# Phase 9 file manifest

## Removed from Git tracking

- `.env`
- `.env.development`

Keep only `.env.example` and `env.example` as non-secret templates. The removed files are intentionally absent from full-source and changed-files archives.

## Dependency and build repair

- `package.json`, `package-lock.json` — version `1.2.0-rc.3`, secure current toolchain, full audit and bundle contracts.
- `vite.config.ts`, `vitest.config.ts` — Vite 8 React plugin and ESM-safe path resolution.
- `scripts/lib/bundle-budget.mjs` — deterministic release asset limits.
- `scripts/check-bundle-budget.mjs` — post-build budget enforcement.
- `scripts/test-bundle-budget.mjs` — pass, source-map and oversized-chunk regression scenarios.

## GitHub security and release operation

- `.github/workflows/security.yml` — scheduled, push and pull-request full dependency audit.
- `README.md`, `docs/GITHUB_GO_LIVE_SETUP.md`, `docs/PRODUCTION_RUNBOOK.md` — updated commands, branch checks and evidence process.
- `docs/GO_LIVE_EVIDENCE_REGISTER.md` — exact external evidence needed for a production decision.
- `docs/GO_LIVE_STATUS_V9.md` — current readiness and remaining work.
- `docs/PHASE_9_VERIFICATION.md` — reproducible verification record.
