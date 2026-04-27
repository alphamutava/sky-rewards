# Sky Kenya - Current State Audit

## Repository Map
- `/src/app`: Next.js App Router UI, layouts, pages, and API routes.
- `/src/components`: React components including Shadcn UI library elements and custom application layout components.
- `/src/cron`: Node-cron background jobs for processing payouts, tracking elite rankings, and cleanup.
- `/src/lib`: Core application libraries (Prisma configuration, NextAuth, M-Pesa client, SMS logic, rate limiters, API error handling, and utilities).
- `/src/services`: Business logic abstraction layer (WalletService, CampaignService, SubmissionService, ViewService, AdminService, EliteService, NotificationService).
- `/src/validators`: Zod schemas for strict request input validation.
- `/prisma`: Prisma schema definitions and database seeding scripts.
- `/public`: Static application assets.
- `/docs`: Project documentation and architectural records.

## Tech Stack Inventory
- **Languages:** TypeScript (strict mode enabled but `ignoreBuildErrors: true` in Next config), JavaScript, HTML.
- **Frameworks/Libraries:** Next.js 14.2.3 (App Router), React 18, Tailwind CSS, Lucide React, Shadcn/Radix UI primitives.
- **Backend/ORM:** Prisma ORM with `@prisma/adapter-pg`.
- **Database:** PostgreSQL (currently configured to run via an embedded Node module locally `pg-embedded`).
- **Auth:** NextAuth.js v4 (Credentials Provider with custom bcrypt hashing).
- **Validation:** Zod.
- **Background Jobs:** Node-cron (in-process).

## Entry Points
- **Development / Production:** Standard Next.js server (`npm run dev` / `npm start`). 
- **Database:** Local embedded PostgreSQL server spun up via `node start-db.js`.
- **Background Jobs:** Initialized within Next.js API routes or server contexts upon launch, binding to the same Node process.

## Data Model
- **User:** Represents all platform actors (Creators, Advertisers, Brands, Admins, Viewers). Tracks balances, authentication credentials, and engagement stats.
- **Campaign:** Advertising campaigns created by Brands. Tracks budget, reward structures, constraints, and status.
- **Submission:** Content submitted by Creators to specific Campaigns. Tracks views, earning accruals, and review status.
- **Transaction:** The financial ledger tracking Deposits, Withdrawals, Platform Commissions, Creator Payouts, and Refunds.
- **Review:** Admin reviews applied to Submissions.
- **Notification:** In-app notifications for users.
- **SystemSetting:** Key-value store for global platform configurations.
- **AuditLog:** Tracking for critical system actions (e.g., M-Pesa callbacks, Campaign creation).

## External Dependencies
- **Payment Rails:** Safaricom Daraja API. Uses STK Push for deposits and B2C API for withdrawals.
- **SMS / Communications:** Africa's Talking API (configured in `src/lib/sms.ts` but heavily reliant on `console.log` in dev).
- **Email:** Resend API (logic exists in `NotificationService`, but keys and environment variables are incomplete).

## Dead Code and Orphan Modules
- `landing.html` (Root directory) - Orphaned standalone HTML prototyping file.
- `sk_kenya_app.html` (Root directory) - Orphaned standalone HTML prototyping file.
- Unused/stubbed functions within `trust-score.ts` which just defer to `EliteService`.

## Security Posture
- **Secrets Handling:** Hardcoded test secrets reside in the `.env` file (e.g., DB URLs, API keys), posing a risk if committed. A robust secret manager pattern is missing.
- **Auth Flow:** Custom credentials provider with `bcryptjs`. While functional, it lacks MFA options beyond a basic SMS OTP system. Session management relies entirely on NextAuth JWTs.
- **Input Validation:** High quality. Zod schemas exist and are actively applied in almost all mutating API routes.
- **Rate Limiting:** Implemented via `rate-limiter-flexible` acting primarily in memory (`src/lib/rate-limiter.ts`), leaving it vulnerable to bypass if the application is horizontally scaled across multiple instances.
- **Headers & CORS:** Basic security headers are injected via `next.config.mjs` (XSS, HSTS, Frame Options). CORS policies are too permissive and lack explicit origin lockdown.
- **Callback Security:** M-Pesa callbacks (`callback-validator.ts`) attempt CIDR IP validation, but this mechanism can be bypassed or rendered moot if a reverse proxy strips or spoofs the IP.

## Test Coverage
- **Current %:** 0%
- **Evidence:** The `npm run test` or testing scripts are entirely missing from `package.json`. No `*.test.ts` or `*.spec.ts` files exist within the `src/` directory tree.
- **Critical Uncovered Paths:** Wallet balance updates (`WalletService.completeTransaction`), M-Pesa STK/B2C callback handlers, Submission view anti-fraud logic (`ViewService.trackView`), and password hashing validations.

## Build & Deploy
- **CI/CD:** None present. There are no `.github/workflows` or similar continuous integration configurations.
- **Environments:** No explicit distinction between `staging` and `production` infrastructure. The `.env` file relies on a simplistic `NODE_ENV` toggle.
- **Infra-as-code:** None present. No Dockerfiles, Terraform, or Kubernetes manifests exist.

## Top 20 Risks
1. **In-Memory Cron Jobs (`src/cron/index.ts:39`)** - *Severity: Critical, Likelihood: High*. Background jobs run in the Next.js process. If the application horizontally scales, payouts will trigger multiple times, causing financial loss.
2. **Database Transactions inside HTTP Callbacks (`src/app/api/mpesa/callback/b2c/result/route.ts:68`)** - *Severity: High, Likelihood: High*. Refund logic on a failed B2C callback updates wallet balances. If Safaricom sends duplicate callbacks or retries on network timeout, users could be refunded multiple times. Idempotency checks are insufficient.
3. **Embedded Database in Production (`start-db.js`)** - *Severity: High, Likelihood: High*. Running PostgreSQL via `pg-embedded` within the Node module folder is highly unstable, prone to corruption, and completely unscalable for production loads.
4. **No Automated Testing (`package.json`)** - *Severity: High, Likelihood: Certain*. 0% test coverage means regressions in the financial ledger or auth systems will ship directly to users.
5. **Rate Limiting is In-Memory (`src/lib/rate-limiter.ts`)** - *Severity: Medium, Likelihood: High*. `rate-limiter-flexible` lacks a Redis backend. Load balancing across instances negates rate limiting entirely, opening vectors for brute force or API abuse.
6. **M-Pesa IP Allowlist Validation Flaws (`src/lib/mpesa/callback-validator.ts:32`)** - *Severity: High, Likelihood: Medium*. Trusting `x-forwarded-for` blindly without enforcing a strict, verified proxy chain allows malicious actors to spoof Safaricom IPs and manipulate payment callbacks.
7. **Environment Variable Mismatch (`src/services/payment.service.ts:188`)** - *Severity: High, Likelihood: High*. The code calls `process.env.MPESA_B2C_CALLBACK_URL`, but standard configuration uses `MPESA_CALLBACK_BASE_URL`. This will cause callback failures in production.
8. **Missing DB Indexes on Foreign Keys (`prisma/schema.prisma`)** - *Severity: Medium, Likelihood: High*. High-volume tables like `Transaction` and `Submission` lack targeted indexes on relations, leading to slow queries and DB lockups at scale.
9. **No Graceful Shutdown (`src/server.ts` or equivalent missing)** - *Severity: Medium, Likelihood: High*. Deployments or crashes will violently interrupt in-flight wallet transactions and API requests.
10. **Incomplete Error Taxonomy (`src/lib/errors.ts`)** - *Severity: Low, Likelihood: High*. Lacks a standardized error envelope structure across all endpoints.
11. **Client-Side Environment Leaks (`.env`)** - *Severity: High, Likelihood: Low*. Storing raw secrets in the primary `.env` file increases the risk of accidental commits.
12. **SMS Fallback Mechanism (`src/lib/sms.ts:51`)** - *Severity: Medium, Likelihood: High*. Logs OTPs to console in dev; if `NODE_ENV` accidentally slips, OTPs become visible in server logs.
13. **Inadequate Campaign Budget Refund Logic (`src/services/campaign.service.ts:338`)** - *Severity: Medium, Likelihood: High*. The logic to refund remaining budget to advertisers when a campaign expires is literally an empty comment `// Create refund transaction logic here`.
14. **Lack of Idempotency on Mutating Endpoints (`src/app/api/wallet/withdraw/route.ts`)** - *Severity: High, Likelihood: Medium*. Repeated rapid clicks on the withdraw button could bypass standard balance checks if requests arrive simultaneously.
15. **Unstructured Logging (`src/cron/index.ts:14`)** - *Severity: Low, Likelihood: Certain*. Reliance on `console.log` prevents effective observability, alerting, and debugging in production.
16. **Missing Data Encryption at Rest (`prisma/schema.prisma`)** - *Severity: High, Likelihood: Medium*. PII (Phone numbers, emails, names) are stored in plaintext. A DB dump leak compromises all users.
17. **Lack of Dependency Scanning (`package.json`)** - *Severity: Medium, Likelihood: High*. No automated checks for CVEs in third-party modules.
18. **Next.js `ignoreBuildErrors: true` (`next.config.mjs:5`)** - *Severity: High, Likelihood: Certain*. Shipping type-broken code to production guarantees runtime panics.
19. **Missing Dead-Letter Queues for B2C Failures (`src/services/payment.service.ts`)** - *Severity: High, Likelihood: Medium*. Failed financial operations log to the console or DB but have no human-in-the-loop retry or review mechanism.
20. **No Infrastructure-as-Code** - *Severity: Medium, Likelihood: High*. Hand-rolled servers lead to configuration drift and delayed disaster recovery.

## What this product actually does
Sky Kenya is a two-sided marketplace connecting brands (Advertisers) with short-form video creators. Brands deposit funds via M-Pesa into a digital wallet, create campaigns with specific briefs, and set a fixed payout rate per 1,000 verified views (e.g., KES 500 / 1k views). 

Creators browse these campaigns, download necessary assets, and upload their created content (typically TikToks, YouTube Shorts, or Instagram Reels) back to the platform. Once an admin approves the submission, the creator's content begins tracking views, and they earn money directly proportional to the engagement they generate, subject to anti-fraud limits and budget caps.

As creators accrue earnings, they can withdraw their balance directly to their Safaricom M-Pesa accounts via the platform's B2C payment integration. The system takes a platform commission fee off the top of campaign budgets, ensuring profitability while facilitating the distribution of micro-payments to a decentralized workforce of influencers and everyday creators.
