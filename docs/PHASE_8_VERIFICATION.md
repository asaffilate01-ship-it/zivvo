# Phase 8 verification record

Date: 2026-08-02

## Passed locally

- Clean `npm ci --ignore-scripts`: 588 packages installed from the public npm lockfile.
- `npm run check`: repository/workflow/public-claim/Edge/native policies, production configuration, release/smoke/SBOM/production-gate contracts, TypeScript, ESLint, 25 Vitest tests and the Vite 8 build all passed.
- `npm audit --audit-level=high`: zero high or critical advisories; two moderate React Router advisories remain.
- `npm run release:sbom` and `npm run release:sbom:verify`: deterministic CycloneDX 1.5 SBOM verified with 585 components.
- `npm run native:sync`: web assets and five Capacitor plugins synced successfully to Android and iOS.
- All seven GitHub workflow files parse as YAML and pass the immutable-action/least-permission repository policy.

## Requires GitHub or real-service execution

- Browser tests did not reach an application assertion locally because the sandbox has no Playwright Chromium binary and the browser CDN returned an empty/truncated archive. The checked-in CI and staging workflows install Chromium on GitHub-hosted runners; the previous live-main E2E job was green.
- Android Gradle execution requires the Gradle distribution endpoint, which is unavailable from this sandbox. The previous live-main Android test/lint/unsigned-release job was green; the updated workflow reruns the same job after the clean dependency/native policy checks.
- iOS compilation requires macOS/Xcode. The prior failure was recovered from the GitHub job log and was exactly `cannot find 'SceneDelegateProxy' in scope`. Phase 8 replaces it with the Capacitor 8.4.2 `ApplicationDelegateProxy` API and adds a fail-closed source check. The GitHub Xcode rerun remains the authoritative proof.
- Production environment validation, staging authentication, database/RLS, Stripe, legal/accessibility, monitoring, rollback, signing and store proof require protected GitHub Environments and the actual external services.

The two remaining React Router advisories have no lower-risk compatible release at this date: the audit-suggested 7.18.2 upgrade is affected by a newer high-severity RSC CSRF advisory. Zivvo therefore retains 6.30.4, rejects raw/encoded/double-encoded backslash and protocol-relative navigation targets, and routes server-provided payments through a Stripe-only HTTPS validator until a suitable upstream release is available.
