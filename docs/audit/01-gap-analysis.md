# Sky Kenya - Gap Analysis

This document compares the current state of the Sky Kenya codebase against strict launch-grade criteria necessary to support a billion-dollar valuation narrative.

## 1. Reliability
- **Current State:** Relies on an embedded PostgreSQL database spun up via a Node script. Background cron jobs (payouts, expirations) run directly inside the Next.js memory space. Missing idempotency checks on financial callbacks.
- **Launch-Grade Requirement:** Database must be a managed, highly available service (e.g., AWS RDS, Supabase). Background jobs must be offloaded to a dedicated distributed worker queue (e.g., BullMQ, Temporal) to allow the web tier to horizontally scale without duplicating cron executions. Idempotency keys must be enforced on all financial mutations.
- **Gap:** **CRITICAL.** The current setup will corrupt data and duplicate payouts if scaled beyond a single instance.

## 2. Security
- **Current State:** M-Pesa IP validation trusts `x-forwarded-for` indiscriminately. Plaintext PII in the database. `ignoreBuildErrors: true` enabled in production builds. Basic SMS OTP is unencrypted. Hardcoded test secrets reside in `.env`.
- **Launch-Grade Requirement:** Zero-trust architecture. Secrets managed via AWS Secrets Manager or HashiCorp Vault. Data-at-rest encryption for sensitive fields (phone numbers, emails). Strict proxy-chain validation for incoming webhooks. SBOM generation and automated CVE scanning.
- **Gap:** **HIGH.** Fails standard enterprise vendor security assessments. High risk of financial manipulation via callback spoofing.

## 3. Scalability
- **Current State:** Monolithic Next.js application tightly coupled to local disk processes. Missing connection pooling for the database.
- **Launch-Grade Requirement:** Stateless web tier capable of scaling to hundreds of instances. PgBouncer or equivalent connection pooling. Read-replicas for heavy analytic/dashboard queries.
- **Gap:** **HIGH.** The architecture hits a hard ceiling at ~100 concurrent requests due to synchronous financial logic and DB bottlenecks.

## 4. Observability
- **Current State:** Debugging relies entirely on `console.log()` and `console.error()`. No centralized error tracking.
- **Launch-Grade Requirement:** Structured JSON logging with correlation IDs tracking requests across boundaries. APM integration (Datadog/New Relic) tracking RED metrics (Rate, Errors, Duration). Sentry for unhandled exception tracking.
- **Gap:** **HIGH.** If a production incident occurs, operators will be flying blind with no ability to trace the root cause.

## 5. UX Polish
- **Current State:** The landing page is a massive single file containing mock data and fake modal popups. Forms lack robust error handling UX.
- **Launch-Grade Requirement:** Componentized, DRY front-end architecture. Every form must have clear validation states, loading spinners, and graceful error degradation. Empty states must guide the user to their next action.
- **Gap:** **MEDIUM.** The UX feels like a prototype rather than a premium financial product.

## 6. Compliance
- **Current State:** No Privacy Policy, Terms of Service, or Data Processing Agreement templates exist. No user data deletion mechanism (GDPR/CCPA "Right to be Forgotten").
- **Launch-Grade Requirement:** Legally vetted ToS and Privacy documents. Soft-delete mechanisms with scheduled hard-delete purging for compliance.
- **Gap:** **HIGH.** Launching without these exposes the company to immediate legal liability.

## 7. Billing / Monetization
- **Current State:** M-Pesa STK and B2C rails are present but the internal ledger lacks double-entry accounting principles. Refund logic for expired campaigns is an empty `// TODO` comment.
- **Launch-Grade Requirement:** Robust, transactional, double-entry general ledger ensuring `credits == debits` at all times. Automated reconciliation scripts against Safaricom's reports.
- **Gap:** **CRITICAL.** Financial leaks are guaranteed due to incomplete refund logic and lack of ledger integrity checks.

## 8. Onboarding
- **Current State:** Basic NextAuth registration form.
- **Launch-Grade Requirement:** "Aha moment" within 3 minutes. Guided tooltips, profile completeness gamification, and automated welcome emails via Resend.
- **Gap:** **LOW.** Functional, but lacks the polish required for viral user retention.

## 9. Documentation
- **Current State:** No developer onboarding guide, API specifications, or system architecture diagrams.
- **Launch-Grade Requirement:** Comprehensive `README.md`, OpenAPI/Swagger specifications for the REST surface, Mermaid architecture diagrams, and an operational Runbook.
- **Gap:** **MEDIUM.** Technical debt will accumulate rapidly as new engineers struggle to understand the system.

## 10. Legal
- **Current State:** Missing `/legal` scaffolding.
- **Launch-Grade Requirement:** Dedicated static pages for legal compliance, clearly outlining creator payment terms and brand liability.
- **Gap:** **HIGH.** Essential for commercial viability and brand trust.
