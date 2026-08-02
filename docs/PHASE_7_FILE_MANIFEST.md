# Phase 7 file manifest

## Security and dependency repair

- `.env.development` — removed from tracking.
- `.gitignore`, `android/.gitignore`, `android/app/.gitignore`, `ios/.gitignore`, `ios/App/CapApp-SPM/.gitignore` — runtime, signing and generated-output exclusions.
- `package.json`, `package-lock.json`, `vite.config.ts`, `vitest.config.ts`, `ios/App/CapApp-SPM/Package.swift` — reproducible public-registry dependency/toolchain and native package repair.
- `scripts/check-repository-hygiene.mjs`, `scripts/check-native-config.mjs` — ignore, lockfile provenance/integrity, workflow-install and native-version regression policy.

## Release evidence and staging acceptance

- `scripts/lib/sbom.mjs` — deterministic CycloneDX model and validation.
- `scripts/generate-sbom.mjs`, `scripts/verify-sbom.mjs`, `scripts/test-sbom.mjs` — generation, parity verification and regression contract.
- `.github/workflows/release-readiness.yml` — retains the verified SBOM with release artifacts.
- `.github/workflows/staging-acceptance.yml` — protected deployed-site, backend-health and browser evidence.
- `playwright.config.ts` — safe external HTTPS target support without starting a local server.
- `e2e/authenticated-staging.spec.ts` — non-privileged authenticated buyer acceptance.

## Operations documentation

- `docs/GITHUB_GO_LIVE_SETUP.md` — branch rules, Environments, secrets, run order and rotation steps.
- `docs/GO_LIVE_STATUS_V7.md` — current readiness and remaining external gates.
- `docs/PRODUCTION_RUNBOOK.md` — SBOM and staging workflow release sequence.
