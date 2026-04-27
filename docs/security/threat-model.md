# Threat Model: Sky Kenya

## Methodology: STRIDE
Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege.

## High-Risk Data Flows

### 1. M-Pesa B2C Webhook (Payment Callbacks)
- **Threat (Spoofing):** Attacker sends a fake success callback to fund their wallet.
- **Mitigation:** Enforce IP allowlisting (`MPESA_ALLOWED_IPS`). The backend only trusts connections from verified Safaricom IP ranges. Validate `ConversationID` against the local database.

### 2. Wallet Withdrawal (Double Spend)
- **Threat (Tampering):** Attacker sends 100 simultaneous withdrawal requests.
- **Mitigation:** Redis-backed Idempotency Keys (`src/lib/idempotency.ts`) ensure the mutation is only processed once. Database transactions are isolated and use pessimistic locking where applicable.

### 3. Campaign Budget Refund
- **Threat (Repudiation):** Brand claims budget was not refunded correctly.
- **Mitigation:** Strict double-entry ledger logic in `Transaction` table. Audit logs record the exact timestamp and amount of the refund.

### 4. Database Breach
- **Threat (Information Disclosure):** Database dump is leaked.
- **Mitigation:** PII (Phone, Email, National ID) is encrypted at rest using an AES-256-GCM Prisma extension. The encryption key resides in AWS Secrets Manager, making the database useless without the key.

### 5. Brute Force Login
- **Threat (Denial of Service):** Attacker tries to guess creator passwords.
- **Mitigation:** Upstash Redis rate limiting in `middleware.ts` restricts authentication endpoints to 5 requests per 15 minutes per IP.

### 6. Creator to Admin (Privilege Escalation)
- **Threat (Elevation of Privilege):** Creator forces a role change in their API request.
- **Mitigation:** API routes utilize strict Zod schemas that reject role modifications. JWT tokens sign the role securely.
