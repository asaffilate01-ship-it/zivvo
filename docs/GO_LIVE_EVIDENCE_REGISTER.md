# Zivvo go-live evidence register

This register turns “ready” into verifiable production approval. Create one completed copy for the exact release SHA. Never commit credentials, customer data, private keys or confidential legal advice; use access-controlled HTTPS evidence links.

## Release identity

| Field | Required value |
|---|---|
| Release version | `1.2.0-rc.3` or the final approved version |
| Full commit SHA | 40-character SHA used by every build and acceptance run |
| Scope | `web` or `web-and-native` |
| Staging artifact | `zivvo-staging-<SHA>` |
| Production candidate | `zivvo-production-candidate-<SHA>` |
| Release owner | Named accountable person |
| Planned release time | Approved UTC timestamp |

## Mandatory evidence

Every row must be `PASS`, identify an owner and link to a specific retained record. `N/A` is permitted only for native evidence when the approved scope is `web`.

| Gate | Status | Required proof | Owner | Evidence URL |
|---|---|---|---|---|
| Repository | PENDING | Protected `main`; green CI, E2E, CodeQL, full dependency audit, Android and iOS checks on the release SHA |  |  |
| Credential rotation | PENDING | Previously committed browser keys reviewed; billable keys rotated/restricted; intended Supabase/Stripe projects confirmed |  |  |
| Staging build | PENDING | Successful Release readiness run and retained immutable staging artifact |  |  |
| Staging acceptance | PENDING | Authenticated browser journey, security headers, release metadata and backend health successful for the same SHA |  |  |
| Database | PENDING | Migration reconciliation, restored backup, PITR proof and anonymous/buyer/seller/dealer/agent/inspector/admin RLS matrix |  |  |
| Edge Functions | PENDING | Tracked functions deployed; CORS, authentication, rate-limit, idempotency and scheduled-job results retained |  |  |
| Payments | PENDING | Subscription, boost, reservation, inspection, auction, winner and arbitrage flows; refund/dispute/failure/replay/reconciliation evidence |  |  |
| Security | PENDING | Threat review, secret scanning, dependency audit, CodeQL, abuse controls and accepted outstanding risk |  |  |
| Privacy/legal | PENDING | Final German operator identity and marketplace, auction, payment, consumer, privacy and cookie wording approved |  |  |
| Accessibility | PENDING | Independent BFSG/WCAG review covering keyboard, screen reader, zoom, contrast, forms, dialogs, charts and payments |  |  |
| Monitoring | PENDING | Frontend, Supabase, auth, Edge Function, scheduled job and Stripe alerts tested with PII scrubbing |  |  |
| Operations | PENDING | Named on-call/support owners, incident process, RPO/RTO, frontend rollback and database restore rehearsal |  |  |
| Domain/email | PENDING | Production DNS/TLS, redirects, headers, SPF, DKIM, DMARC and monitored support/privacy/complaints/accessibility inboxes |  |  |
| Native | PENDING | Release signing, push, Universal/App Links, real devices, privacy/data-safety declarations and store approvals |  |  |
| Production candidate | PENDING | Protected Production candidate gate passed using the successful staging-acceptance run ID |  |  |
| Post-deploy | PENDING | Production smoke run verifies exact SHA, environment, critical routes, headers and backend health |  |  |

## Launch decision

- [ ] Every in-scope row is `PASS` and links to evidence for this exact SHA.
- [ ] No severity-1 or severity-2 defect is open.
- [ ] Product, engineering, security, privacy/legal, payments, support and operations owners approved the release.
- [ ] Rollback owner and previous immutable artifact are confirmed.
- [ ] Release tag and notes will identify the production-candidate and post-deploy run IDs.

Final decision: **PENDING**

Approved by:

Approved at:

Production deployment URL:

Post-deploy run URL:
