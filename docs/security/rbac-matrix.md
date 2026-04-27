# Role-Based Access Control (RBAC) Matrix

## Roles Defined
- **VIEWER**: Default unverified user. Can browse public campaigns.
- **CREATOR**: Verified user who can submit content and earn money.
- **ADVERTISER** (BRAND): Can create and fund campaigns.
- **ADMIN**: Can review submissions, pause campaigns, and view analytics.

## Permission Matrix

| Feature | VIEWER | CREATOR | ADVERTISER | ADMIN |
|---------|---------|---------|------------|-------|
| View Public Campaigns | ✅ | ✅ | ✅ | ✅ |
| Submit Content | ❌ | ✅ | ❌ | ❌ |
| Withdraw Funds | ❌ | ✅ | ✅ | ❌ |
| Create Campaign | ❌ | ❌ | ✅ | ✅ |
| Approve Submissions | ❌ | ❌ | ❌ | ✅ |
| Issue Manual Payouts | ❌ | ❌ | ❌ | ✅ |
| Access Admin Dashboard | ❌ | ❌ | ❌ | ✅ |

## Implementation Notes
Role enforcement occurs in two layers:
1. **Edge Middleware (`src/middleware.ts`)**: Broad path-based blocking (e.g., `/admin` requires `ADMIN`).
2. **API Routes (`src/app/api/...`)**: Deep authorization logic verifying the specific entity ownership (e.g., a Creator can only view their own Wallet).
