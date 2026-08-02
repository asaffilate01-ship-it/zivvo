# Phase 6 file manifest

This phase is cumulative and must be applied to GitHub `main` at or after commit `5b90bbcbe9d2e4d14eddd67613246596f87df78d`.

## Required deletions

- `.env`
- `.env.development`
- `android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java`

Do not recreate or upload those files. Keep `.env.example` only, and rotate or restrict values that existed in earlier Git history.

## New files

- `android/.gitignore`
- `.nvmrc`
- `android/app/.gitignore`
- `android/app/src/androidTest/java/de/zivvo/app/ExampleInstrumentedTest.java`
- `ios/.gitignore`
- `ios/App/CapApp-SPM/.gitignore`
- `ios/App/App/PrivacyInfo.xcprivacy`
- `scripts/check-public-claims.mjs`
- `scripts/check-workflow-security.mjs`
- `scripts/verify-production-artifact.mjs`
- `src/test/legalConfig.test.ts`
- `src/test/i18nLegalIdentity.test.ts`
- `docs/GO_LIVE_STATUS_V6.md`
- `docs/PHASE_6_FILE_MANIFEST.md`

## Updated file groups

- Repository/env policy: `.gitignore`, `.env.example`, `package.json`, `package-lock.json`
- GitHub automation: all five files under `.github/workflows/`
- Native validation: `android/app/src/main/AndroidManifest.xml`, the iOS Xcode project, and `scripts/check-native-config.mjs`
- Browser acceptance: `e2e/public-and-auth.spec.ts`
- Legal/contact rendering: `src/lib/legalConfig.ts`, `src/i18n/index.ts`, both locale files and the legal-policy pages
- Public trust and UX: `Footer.tsx`, `HeroSearch.tsx`, `Index.tsx`, `Leasing.tsx`, `DealerLanding.tsx` and `Pitch.tsx`
- Build policy and performance: `vite.config.ts`, `vitest.config.ts`, production configuration scripts and artifact verification
- Operations: `docs/PRODUCTION_RUNBOOK.md`

## Required GitHub actions after upload

1. Confirm the three required deletions are present in the GitHub commit; a changed-files-only ZIP cannot delete files automatically.
2. Configure all legal and public-contact variables referenced by `.github/workflows/release-readiness.yml` in both protected Environments.
3. Require CI, Security and Native validation on `main`, then open a pull request and retain the green checks.
4. Run **Release readiness** for staging, deploy its immutable artifact, and run **Post-deploy verification** with the exact full commit SHA.
5. Complete the external gates listed in `docs/GO_LIVE_STATUS_V6.md` before promoting that same artifact to production.

No real credential, signing identity, approved legal operator value or provider acceptance evidence is included in this phase.
