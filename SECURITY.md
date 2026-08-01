# Security policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the security contact configured for the production operator. Do not open a public issue containing credentials, personal data, exploit details, or customer records.

Include the affected URL or component, reproducible steps, expected impact, and any evidence that can be shared safely. The operator should acknowledge a report within two business days and coordinate remediation and disclosure based on severity.

## Security expectations

- Never commit `.env` files, Supabase service-role keys, Stripe secrets, webhook secrets, cron secrets, stock-feed keys, or DMS credentials.
- Browser-visible Google and Supabase keys must be restricted to the intended origins and APIs.
- Payment, subscription, reservation, auction, and commission state is accepted only from server-side verification or guarded database functions.
- Production changes require review, CI, a database migration plan, and a rollback path.
- Rotate a credential immediately if it may have entered source control, logs, screenshots, support tickets, or client-side code.

Supported versions are the production branch and the latest tagged release only.
