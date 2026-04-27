# Secrets Management Strategy

## Objective
To ensure zero hardcoded secrets exist within the application source code or environment files checked into version control. All sensitive keys must be dynamically loaded at runtime from a secure vault.

## Current State
The project relies on a `.env` file via `process.env`. `src/lib/config.ts` enforces that all necessary variables are present and typed via `zod`.

## Target Architecture (Launch Grade)
We will integrate a Secret Manager (AWS Secrets Manager or HashiCorp Vault) into the application lifecycle. 

### Implementation Path
1. **Infrastructure as Code (IaC):** Use Terraform/Pulumi to provision an AWS Secrets Manager secret named `skykenya/prod/app-secrets`.
2. **Container Injection:** Modify the Docker `ENTRYPOINT` script or ECS Task Definition to pull secrets directly from AWS Secrets Manager before starting the Next.js and Worker processes.
   - Example tool: `aws-secretsmanager-caching-client` or chamber (`chamber exec my-service -- npm start`).
3. **Local Development:** Developers will continue to use local `.env` files matching the `.env.example` schema. Development secrets do NOT need vaulting.
4. **Key Rotation:** 
   - `NEXTAUTH_SECRET` and `ENCRYPTION_KEY` must never be rotated without a migration plan (doing so will log out all users or corrupt encrypted PII).
   - Database credentials and third-party API keys (Resend, Africa's Talking) should be rotated every 90 days.

## Secret Audit Matrix
| Secret Type | Storage Mechanism | Rotation Policy |
|-------------|-------------------|-----------------|
| Database URL| Vault | 90 days |
| M-Pesa Keys | Vault | 90 days |
| API Keys    | Vault | 90 days |
| Auth Secret | Vault (Static) | Manual only |
| PII Cipher Key | Vault (Static) | Manual only |
