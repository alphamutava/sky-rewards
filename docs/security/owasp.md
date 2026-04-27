# OWASP Top 10 Security Audit

## 1. Broken Access Control (A01:2021)
- **Mitigation:** Role-Based Access Control (RBAC) is enforced at the Edge via `src/middleware.ts`. All API routes require authenticated JWT sessions, and sensitive endpoints verify the user's role (`ADMIN`, `ADVERTISER`).
- **Status:** Mitigated.

## 2. Cryptographic Failures (A02:2021)
- **Mitigation:** PII (Phone, Email, National ID) is encrypted at rest using AES-256-GCM via Prisma Extensions (`src/lib/prisma.ts`). The `ENCRYPTION_KEY` is injected via environment variables and never hardcoded. TLS 1.3 is enforced at the load balancer level.
- **Status:** Mitigated.

## 3. Injection (A03:2021)
- **Mitigation:** The application uses Prisma ORM which utilizes parameterized queries, preventing SQL Injection. XSS is prevented by React/Next.js default escaping.
- **Status:** Mitigated.

## 4. Insecure Design (A04:2021)
- **Mitigation:** A STRIDE threat model has been documented. Financial mutations (withdrawals) enforce idempotency to prevent double-spending attacks.
- **Status:** Mitigated.

## 5. Security Misconfiguration (A05:2021)
- **Mitigation:** Strict CORS origins are configured in `middleware.ts`. Security headers (`X-Frame-Options`, `X-Content-Type-Options`) are injected on all responses.
- **Status:** Mitigated.

## 6. Vulnerable and Outdated Components (A06:2021)
- **Mitigation:** Dependency scanning (`npm audit`) and SBOM generation (`generate:sbom`) are integrated into the build pipeline. 
- **Status:** Mitigated.

## 7. Identification and Authentication Failures (A07:2021)
- **Mitigation:** NextAuth.js handles session lifecycle securely using HttpOnly, Secure cookies. Passwords are hashed using `bcryptjs` with a high salt round. Brute-force is prevented via Redis rate limiting.
- **Status:** Mitigated.

## 8. Software and Data Integrity Failures (A08:2021)
- **Mitigation:** Safaricom M-Pesa webhooks are validated by enforcing HTTPS and verifying origin IP addresses in production.
- **Status:** Mitigated.

## 9. Security Logging and Monitoring Failures (A09:2021)
- **Mitigation:** Structured JSON logging (Pino) is implemented. Critical actions log to the `AuditLog` database table.
- **Status:** Mitigated.

## 10. Server-Side Request Forgery (SSRF) (A10:2021)
- **Mitigation:** The application does not fetch user-provided URLs server-side. Outbound requests are restricted to known third-party APIs (Safaricom, Africa's Talking).
- **Status:** Mitigated.
