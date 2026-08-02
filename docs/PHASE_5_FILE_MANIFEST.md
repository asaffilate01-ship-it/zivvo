# Phase 5 file manifest

This phase is cumulative and must be applied to GitHub `main` at or after commit `33f0df147dbf4af8d3bcf7f4136bf9cabc46699c`.

## Required deletions

- `.env`
- `.env.development`

Keep `.env.example`. Do not copy real credentials into the repository. Rotate or restrict the removed browser/provider values because earlier versions remain in Git history.

## New file groups

- `.github/workflows/native.yml` and `.github/workflows/post-deploy-verification.yml`
- Android project under `android/`
- iOS project under `ios/`
- Release, native, smoke and Edge Function policy scripts under `scripts/`
- `docs/GO_LIVE_STATUS_V5.md`

## Required GitHub settings after upload

1. Create protected `staging` and `production` Environments using the variable and secret names referenced by `.github/workflows/release-readiness.yml`.
2. Protect `main` and require CI, Security and Native validation checks.
3. Run **Release readiness** for staging, deploy the generated artifact without rebuilding, and run **Post-deploy verification** with the exact commit SHA.
4. Promote the same approved artifact to production and repeat post-deploy verification.

No signing identity, production credential, legal operator value or provider approval is included in this phase.
