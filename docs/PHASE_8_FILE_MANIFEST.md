# Phase 8 file manifest

## Repository, dependency and native repair

- `.env`, `.env.development` — removed from tracking without exposing their former contents.
- `package.json`, `package-lock.json` — current secure build/test toolchain and production-gate contracts.
- `ios/App/App/SceneDelegate.swift` — Capacitor 8 lifecycle and deep-link forwarding repair.
- `scripts/check-native-config.mjs`, `.github/workflows/native.yml` — scene-delegate regression policy and retained Xcode diagnostics.

## Navigation and payment hardening

- `src/lib/safeNavigation.ts`, `src/test/safeNavigation.test.ts` — credential-free HTTPS, encoded-backslash and protocol-relative protections.
- `src/lib/nativeNotifications.ts` — safe internal notification routes.
- Payment/listing/inspection/share components and pages — validated Stripe redirects and isolated external windows.

## Production promotion controls

- `scripts/lib/production-gate.mjs` — production approval, artifact and staging-evidence contract.
- `scripts/verify-production-candidate.mjs` — candidate, SBOM and external-evidence verifier.
- `scripts/test-production-gate.mjs` — regression coverage for accepted, tampered and missing-evidence candidates.
- `.github/workflows/release-readiness.yml` — staging-only release build.
- `.github/workflows/production-candidate.yml` — protected production configuration build bound to accepted staging evidence.

## Documentation

- `docs/GITHUB_GO_LIVE_SETUP.md`, `docs/PRODUCTION_RUNBOOK.md`, `README.md` — exact Environment variables and release order.
- `docs/GO_LIVE_STATUS_V8.md` — current readiness and remaining external gates.
- `docs/PHASE_8_VERIFICATION.md` — passed local checks and clearly bounded GitHub/external verification.
