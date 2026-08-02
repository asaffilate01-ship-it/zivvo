# Zivvo

Zivvo is a Germany-first vehicle marketplace for private sellers, dealers, buyers, agents, inspectors, and platform administrators. This production upgrade includes marketplace search, dealer inventory and landing pages, auctions, reservations, inspections, enquiries, subscriptions, agent onboarding, stock feeds, and role-specific operations dashboards.

## Production upgrade

The upgrade replaces browser-trusted payment and auction flows with server-verified operations, narrows public database access to safe views, adds rate limits and idempotency, encrypts DMS credentials, and provides account deletion and consent-aware advertising. It also removes unavailable UK-specific checks and syndication claims, standardises the experience on Germany/EUR, and improves legal, accessibility, responsive, performance, and deployment foundations.

See [docs/UPGRADE_SUMMARY.md](docs/UPGRADE_SUMMARY.md) for the audit outcome and [docs/PRODUCTION_RUNBOOK.md](docs/PRODUCTION_RUNBOOK.md) for the release procedure.

## Local development

Requirements: Node.js 22+, npm 10+, and a Supabase project.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Only `VITE_*` values are exposed to the browser. Keep service-role, Stripe secret, DMS encryption, cron, AI, and server Maps keys in Supabase Edge Function secrets.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run audit:production
npm run test:production-gate
```

`npm run build:production` additionally rejects missing, placeholder, non-HTTPS, and non-live production configuration. It is intentionally expected to fail until real operator, Supabase, Stripe, and Maps values are supplied.

The protected **Production candidate gate** binds a production build to successful staging acceptance for the exact commit and requires linked security, database, payments, legal, accessibility and operations evidence before it emits a deployable candidate.

## Architecture

- React 18, TypeScript, Vite, Tailwind CSS, and Radix UI
- Supabase Auth, Postgres/RLS, Storage, and Edge Functions
- Stripe Checkout and webhook-confirmed payment/subscription state
- Capacitor foundations for Android and iOS packaging
- German default locale and EUR money flows

Do not deploy from a working tree that has not passed the go-live gates in the production runbook.
