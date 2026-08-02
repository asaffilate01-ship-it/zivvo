# Go-live status — v1.2.0-rc.1 phase 4

Updated: 2026-08-02

## What phase 4 closes

- Restores an immutable dependency install and pins React Router to the audited 6.30.4 release.
- Removes runtime environment files and development credential surfaces from the production tree.
- Prevents stale lockfiles, tracked environment files, duplicate migration timestamps, preview mobile URLs, and development seed/key endpoints from passing CI.
- Makes the Capacitor bundle local-first with the stable `de.zivvo.app` application ID. A remote development server is opt-in and cleartext is allowed only for localhost.
- Restricts customer portal and dealer invite functions to configured origins, authenticated users, rate limits, fixed application redirects, bounded JSON bodies, and safe errors.
- Sanitizes stored notification links before React Router navigation to prevent external, protocol-relative, backslash, and executable redirect targets.
- Adds a manual production-environment workflow that validates real GitHub Environment values and produces an immutable `dist` artifact.
- Corrects the remaining US-dollar label in the Germany-first sales pipeline.
- Reduces the German logo payload from about 952 KB to 128 KB and the English logo from about 145 KB to 80 KB, while retaining more than enough resolution for high-density navigation and footer rendering.

## Automated evidence required on the branch

The patch is acceptable only when all of the following pass from a clean checkout:

```bash
npm ci
npm run check
npm run audit:production
npm run test:e2e
```

The manual **Production release readiness** workflow must then pass using the protected GitHub `production` environment. Its artifact is the only frontend artifact approved for staging promotion.

## External gates that code cannot complete

1. Rotate or restrict provider keys that appeared in Git history and configure GitHub production variables/secrets.
2. Apply and reconcile Supabase migrations in staging, deploy the approved Edge Function list, and verify scheduled jobs.
3. Complete Stripe test-mode acceptance, webhook replay/refund/failure testing, and finance reconciliation.
4. Replace all legal placeholders with the approved German operator details and obtain legal/privacy/BFSG sign-off.
5. Enable required CI and security checks, review requirements, signed tags, and branch protection on `main`.
6. Configure monitoring, alerting, PITR/backup evidence, incident ownership, support routing, and a rollback rehearsal.
7. Run browser acceptance against staging and complete native iOS/Android projects, signing, real-device checks, privacy manifests, and store review if native launch is in scope.

Until those external gates are evidenced, this release remains a candidate and must not process live payments.
