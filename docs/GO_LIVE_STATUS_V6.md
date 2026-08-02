# Go-live status — v1.2.0-rc.1 phase 6

Updated: 2026-08-02

## What phase 6 closes

- Actually removes the tracked `.env` and `.env.development` files, restores platform-specific ignore rules, and keeps runtime credentials, signing material and release evidence out of Git.
- Fixes the failing authentication E2E selectors by targeting the unique form controls instead of ambiguous translated labels.
- Fixes Android lint by marking camera and location hardware as optional, replaces the generated sample instrumentation package with `de.zivvo.app`, builds an unsigned release APK in CI, and retains lint/build artifacts.
- Adds `PrivacyInfo.xcprivacy` to the iOS application target with no tracking declaration and the app data categories used by Zivvo. The native policy test verifies that the manifest stays bound to the app target.
- Makes the legal operator, supervisory authority and support/privacy/complaints/accessibility contacts required production configuration. Legal placeholders are rendered through i18n, and the production artifact is rejected if approved values are missing from the compiled files.
- Removes unsupported public numbers, ratings, certifications, availability promises and default dealer accreditations. A repository policy check prevents those claims and retired EU ODR links from returning.
- Replaces the discontinued EU ODR platform link with the current European Commission consumer-redress directory and explains the platform's 20 July 2025 closure.
- Upgrades Vite, Vitest, jsdom, TypeScript and the lint toolchain. Full dependency audit results fall to two moderate React Router advisories and zero high or critical findings.
- Updates GitHub Actions to current Node 24-based major releases and CodeQL v4, pins every action to an immutable commit SHA, adds a workflow security regression gate, and strengthens Android CI to include `assembleRelease`.
- Adds a production-artifact inspection step after every production build so a successful source build cannot ship placeholder identity or unsupported trust claims.

## Verified repository evidence

| Gate | Result |
|---|---|
| `npm run check` | Pass: repository/security/native policies, 2 valid + 9 rejected production cases, typecheck, lint, 22/22 unit tests and build |
| `npm run audit:production` | Pass: 0 high, 0 critical; 2 moderate React Router advisories remain registered |
| Full `npm audit` | 0 high, 0 critical; the same 2 moderate advisories |
| Production configuration + artifact inspection | Pass with a non-secret production-shaped fixture; 102 compiled text assets and 10 public identity/contact values inspected |
| `npx cap sync` | Pass for Android and iOS with five Capacitor plugins |
| Local Playwright | Test code starts, but the sandbox blocks the Chromium binary download; GitHub CI remains the authoritative rerun |
| Local Android Gradle | Wrapper download is blocked by the sandbox network; the Native validation workflow remains the authoritative rerun |
| iOS build | Requires the macOS GitHub runner and must pass before merge |

The remaining React Router advisories concern navigation/SSR code. Zivvo is a client-only Vite SPA and does not use React Router SSR/RSC. The currently published v7 line has high-severity server/RSC advisories, so the production audit deliberately remains on 6.30.4 until a release removes the conflict. Treat this as a temporary, reviewed risk—not as a claim that the dependency has no advisory.

## Readiness after phase 6

These percentages measure repository implementation separately from evidence that can only be produced in the real services. They are planning estimates, not certification.

| Area | Repository readiness | External evidence still required |
|---|---:|---|
| Web application and UX | 94% | Staging browser/device acceptance and independent BFSG/WCAG review |
| Security engineering | 92% | Credential rotation, production monitoring, GitHub security results and threat-model acceptance |
| Backend and data | 78% | Staging restore, migration reconciliation, Edge Function deployment and role/RLS acceptance |
| Payments | 76% | Stripe live/test acceptance, webhook replay/refund/failure evidence and finance sign-off |
| Release engineering | 95% | Protected environments/branch rules and successful staging/production workflow evidence |
| Native application code | 76% | Signing, push credentials, branded store assets, privacy-label reconciliation and real-device/store review |
| Legal and operations | 60% | Approved operator values, counsel approval, PITR proof, on-call ownership and rollback rehearsal |

Code/repository readiness is approximately **94%**. Public commercial go-live remains approximately **83%** until service, legal, payment and operational evidence exists. Native store readiness is approximately **76%**.

## Gates code cannot complete

1. Rotate or restrict every credential that ever appeared in Git history and configure the protected GitHub `staging` and `production` Environments.
2. Protect `main` with required CI, Security and Native validation checks, review requirements and blocked direct pushes.
3. Rerun CI/E2E/CodeQL/Dependency Review/Native validation on this exact commit and retain the green run links.
4. Restore a production-like backup into staging, reconcile and apply all migrations, deploy the approved Edge Functions, test every RLS role, and enable the protected auction/reservation schedules.
5. Complete the Stripe test matrix for subscriptions, reservations, auction deposits, winner payments, refunds, disputes, asynchronous failures and duplicate/replayed webhooks.
6. Supply the real German operator, register, VAT, authority and monitored contact values; obtain privacy, terms, payments/auction and BFSG accessibility approval.
7. Enable monitoring, alert destinations, backup/PITR evidence, incident ownership, RPO/RTO and a rehearsed frontend/database rollback.
8. For native stores, provide signing identities, icons/screenshots, push configuration, reconcile Apple/Google privacy declarations with the manifest, and complete real-device and store review.

Do not enable live payments or advertise production availability until all eight gates have named owners and attached evidence.
