# Tier-1 Operator Runbook

This document provides mitigation steps for the Top 10 expected incidents in the Sky Kenya production environment.

## 1. M-Pesa B2C API Outage
**Symptom:** High failure rate on withdrawal endpoints. Logs show `MpesaError: Timeout` or `503 Service Unavailable` from Daraja API.
**Impact:** Creators cannot withdraw funds.
**Mitigation:**
1. Check [Safaricom Daraja Status Page].
2. If Safaricom is down, pause the BullMQ `payouts` queue:
   ```bash
   redis-cli -u $REDIS_URL SET bull:payouts:pause 1
   ```
3. Announce maintenance on the frontend.
4. Once resolved, resume the queue:
   ```bash
   redis-cli -u $REDIS_URL DEL bull:payouts:pause
   ```

## 2. Redis Connection Exhaustion
**Symptom:** `Ready` probe fails with `Redis connection timeout`. BullMQ jobs stop processing.
**Impact:** Background tasks (campaign expiry, payouts, elite rankings) halt. Rate limiting fails open or blocks all traffic.
**Mitigation:**
1. Check Redis memory and maxclients: `redis-cli INFO clients`.
2. Restart the worker process to drop stale connections:
   ```bash
   npm run stop:worker && npm run start:worker
   ```
3. If memory is full, clear non-critical caches:
   ```bash
   redis-cli --scan --pattern "campaigns:list:*" | xargs redis-cli DEL
   ```

## 3. Postgres Connection Pool Exhaustion
**Symptom:** Logs show `PrismaClientInitializationError: Timed out fetching a new connection from the pool`.
**Impact:** Complete API outage.
**Mitigation:**
1. Identify blocking queries via `pg_stat_activity`.
2. Restart the Next.js instances sequentially to flush the Prisma connection pool.
3. Temporarily decrease `connection_limit` in `DATABASE_URL` via environment variables.

## 4. Unhandled Rejection Loop in Worker
**Symptom:** Worker process repeatedly crashes and restarts (CrashLoopBackOff).
**Impact:** Background jobs fail to process.
**Mitigation:**
1. View Sentry errors for the `worker` project to identify the failing job ID.
2. Manually remove the poisonous job from BullMQ:
   ```typescript
   // via node REPL
   import { payoutQueue } from './src/workers/queue';
   await payoutQueue.remove('bad-job-id');
   ```

## 5. Brute Force Attack on Login
**Symptom:** High spike in `429 Too Many Requests` on `/api/login`.
**Impact:** Upstash Redis quota may be consumed, legitimate users might experience latency.
**Mitigation:**
1. Check the IP address in Sentry/Datadog logs.
2. Add the offending IP/Subnet to the WAF (Cloudflare/AWS WAF) drop list.

## 6. M-Pesa B2C Webhook Secret Compromise
**Symptom:** Unauthorized successful withdrawals logged that do not correspond to initiated B2C requests.
**Impact:** Financial theft.
**Mitigation:**
1. **CRITICAL:** Immediately shut down the server or pause the database.
2. Rotate the `MPESA_CALLBACK_SECRET` in AWS Secrets Manager.
3. Verify `MPESA_ALLOWED_IPS` is strictly enforcing Safaricom's subnets in `src/middleware.ts`.
4. Audit the `AuditLog` table for the extent of the damage.

## 7. NextAuth Misconfiguration
**Symptom:** `JWT_SESSION_ERROR` or users cannot stay logged in.
**Impact:** Users cannot access the platform.
**Mitigation:**
1. Verify `NEXTAUTH_SECRET` has not been accidentally rotated.
2. Check `NEXTAUTH_URL` matches the production domain exactly.

## 8. High Latency on Leaderboard
**Symptom:** `/api/elite/leaderboard` p95 > 1000ms.
**Impact:** Poor user experience.
**Mitigation:**
1. Verify the Redis cache is populating. Check `redis-cli GET elite:100`.
2. If the cache is empty and failing to populate, trigger it manually:
   ```bash
   npm run worker:run-elite
   ```

## 9. Storage Quota Exceeded (Cloudinary)
**Symptom:** Campaign submissions fail with `Cloudinary API Error: Quota exceeded`.
**Impact:** Creators cannot upload videos.
**Mitigation:**
1. Log into Cloudinary dashboard.
2. Upgrade plan or aggressively delete rejected submissions via the API.

## 10. Memory Leak in Next.js Server
**Symptom:** Container memory usage climbs steadily until OOMKilled.
**Impact:** Rolling API outages.
**Mitigation:**
1. Capture a heap snapshot (if running Node with `--inspect`).
2. Rollback to the previous known stable deployment.
3. Review Sentry for recent code changes involving large arrays or unclosed stream handles.
