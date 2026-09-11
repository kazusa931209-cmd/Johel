# Phase 83 — Internet hardening (public deployment)

**Defined:** 2026-09-11  
**Status:** Planned

## Goal

Make JoHEL safe to **publish on the internet and onboard strangers** while keeping the existing constraint: **no paid operational SaaS** for the app itself. LLM usage remains billed through each user's own API key.

This phase delivers six capabilities:

1. **HTTPS**
2. **Encrypted API key storage**
3. **Rate limiting**
4. **Stronger session security**
5. **Backups**
6. **Broader test coverage**

LAN Docker deployment (Phase 33) continues to work unchanged for local/trusted-network use.

---

## Product requirements (specification-level)

* JoHEL may be deployed on the **public internet** behind HTTPS so strangers can register and use the app.
* Users still bring their own OpenAI API key; JoHEL does not require a hosted LLM account to operate.
* The app must resist common abuse on public endpoints (credential stuffing, registration spam, AI endpoint flooding).
* User API keys must not be stored in plaintext once this phase ships.
* Operators must be able to **back up and restore** the SQLite database without ad-hoc volume surgery.
* CI must run automated tests on every change before merge/deploy.

---

## Workstreams

### 1. HTTPS

**Approach:** Terminate TLS **outside** the JoHEL container with a self-hosted reverse proxy (no paid CDN required). Document two supported paths:

| Path | When to use |
| --- | --- |
| **A — Caddy sidecar** | Single VPS; `docker compose` adds a `caddy` service with automatic Let's Encrypt |
| **B — External reverse proxy** | Operator already runs nginx/Caddy/Traefik; JoHEL stays HTTP internally |

**Deliverables**

- `docker-compose.public.yml` (or extend `docker-compose.yml` with a `public` profile) exposing **443** via Caddy, proxying to the existing app on `:4444`.
- Env: `PUBLIC_URL` (e.g. `https://johel.example.com`), `TRUST_PROXY=true`.
- API CORS: allow `PUBLIC_URL` origin (replace hardcoded localhost-only list when `PUBLIC_URL` is set).
- Cookie `secure: true` when `TRUST_PROXY=true` or `NODE_ENV=production` + HTTPS detected.
- [`docs/docker.md`](../docker.md) new section **Public internet deployment** (DNS, firewall, cert renewal, `JWT_SECRET` / `ENCRYPTION_KEY` generation).
- Health check continues to work through `/backend/health`.

**Acceptance**

- Browser shows valid HTTPS; login cookie is `Secure` + `HttpOnly` + `SameSite=Lax`.
- API rejects or ignores spoofed `X-Forwarded-*` when `TRUST_PROXY` is off.

---

### 2. Encrypted API key storage

**Approach:** AES-256-GCM envelope encryption at the application layer. One server secret `ENCRYPTION_KEY` (32 random bytes, base64 in env) encrypts all `settings.apiKey` values.

**Deliverables**

- Module `apps/api/src/lib/secrets/encrypt.ts` — `encryptSecret(plaintext)`, `decryptSecret(ciphertext)` with version byte + IV + auth tag.
- Prisma migration: rename or add column — e.g. keep `apiKey` but store ciphertext + prefix `enc:v1:` OR add `apiKeyCiphertext` and drop plaintext after migration.
- One-time migration script / startup migration: decrypt-not-needed; re-encrypt existing plaintext rows on first read or batch in migration.
- All OpenAI call sites read key via `getUserApiKey(userId)` helper (decrypt once per request).
- `PUT /settings` encrypts before upsert; `GET /settings` still returns masked key only.
- Root `.env.example` documents `ENCRYPTION_KEY` (required in public mode; generate with `openssl rand -base64 32`).
- Fail fast on boot if public deployment flags are set but `ENCRYPTION_KEY` is missing.

**Acceptance**

- Fresh SQLite file contains no readable API keys in `settings`.
- Saving and using a key round-trips through encrypt/decrypt; existing users' keys survive migration.

---

### 3. Rate limiting

**Approach:** Server-side limits using **SQLite-backed counters** (no Redis dependency) or in-memory sliding window with SQLite fallback for multi-instance later. Start with in-memory per-process limits sufficient for single-container public deploy; document that horizontal scale needs shared store.

**Deliverables**

- Middleware `apps/api/src/lib/rate-limit.ts` keyed by `(routeGroup, clientIpOrUserId)`.
- Suggested defaults (tunable via env):

  | Group | Key | Limit |
  | --- | --- | --- |
  | `auth:login` | IP | 10 / 15 min |
  | `auth:register` | IP | 5 / hour |
  | `auth:password` | userId | 5 / hour |
  | `ai:*` | userId | 30 / hour (aggregate) |
  | `api:default` | IP | 300 / 15 min |

- Return `429 Too Many Requests` with `Retry-After` header; toast-friendly error message on web.
- Exempt `GET /health` and static assets.
- Unit tests for window reset and 429 behavior.

**Acceptance**

- Burst login/register attempts receive 429 without hitting bcrypt/DB repeatedly.
- Authenticated AI routes throttle per user, not only per IP.

---

### 4. Stronger session security

**Deliverables**

- Cookie options driven by env:
  - `secure: true` when HTTPS / `TRUST_PROXY`
  - `sameSite: "Lax"` (keep; document why not `Strict` for OAuth-less app)
- JWT TTL configurable (`SESSION_TTL`, default 7d); optional shorter public default (e.g. 3d).
- **Invalidate sessions on password change** — increment `users.sessionVersion` (new column); embed version in JWT; reject stale tokens after reset.
- Reject weak/default `JWT_SECRET` in production (`change-me-in-local-docker` must fail boot when `PUBLIC_DEPLOY=true`).
- Optional: rotate session cookie on login (new token each login).
- Document CSRF posture: state-changing routes use cookie auth + SameSite; no custom CSRF token in v1 unless gap found in review.

**Acceptance**

- After password reset, old session cookie returns 401 on protected routes.
- Public deploy refuses to start with default secrets.

---

### 5. Backups

**Approach:** Operator-run backups without paid backup SaaS.

**Deliverables**

- Script `scripts/backup-db.sh` — SQLite online backup via `sqlite3 .backup` or file copy with API briefly quiesced; writes timestamped file to `BACKUP_DIR`.
- Script `scripts/restore-db.sh` — restore from backup file into `/data/johel.db` with confirmation prompt.
- Optional cron example in docs (`0 3 * * *`).
- Retention env: `BACKUP_RETENTION_DAYS` (default 14) — script deletes older files.
- [`docs/docker.md`](../docker.md) section: backup before upgrade, restore after disaster, **do not** delete `johel-data` volume casually.
- Document that AI Usage History `input`/`output` may contain PII — treat backups as sensitive.

**Acceptance**

- Operator can backup and restore a populated DB; app starts and users retain data.

---

### 6. Broader test coverage

**Approach:** Three layers — unit (existing), API integration, smoke E2E.

**Deliverables**

- **CI** — `.github/workflows/ci.yml`:
  - `pnpm install --frozen-lockfile`
  - `pnpm --filter api test`
  - `pnpm --filter web test`
  - `pnpm --filter web lint`
  - `pnpm --filter web build`
- **API integration tests** (`apps/api/src/routes/__tests__/`):
  - Auth: register, login, logout, password change, session invalidation
  - Settings: save key (encrypted at rest assertion), masked read
  - Rate limit: 429 on auth burst (use low limits in test env)
  - Owner isolation: user A cannot read user B profile
- **E2E smoke** (Playwright, optional job in CI or nightly):
  - Register → login → save Settings API key → open Generate prerequisites page
- **Security unit tests**:
  - encrypt/decrypt roundtrip, wrong key fails gracefully
  - `resolveAiModelName` unchanged (regression)

**Acceptance**

- CI green on main; failing tests block merge.
- At least one integration test per new security module (rate limit, encryption, session version).

---

## Implementation order (recommended)

1. **Encrypted API key storage** — highest data-risk fix; unblock before public deploy.
2. **Stronger session security** — quick wins (session version, secret validation).
3. **Rate limiting** — before exposing registration to internet.
4. **HTTPS docs + compose profile** — operator-facing; test with staging domain.
5. **Backups** — scripts + docs before go-live.
6. **Broader test coverage + CI** — land incrementally; CI should be green before calling phase done.

---

## Files likely touched

| Area | Paths |
| --- | --- |
| Secrets | `apps/api/src/lib/secrets/` |
| Rate limit | `apps/api/src/lib/rate-limit.ts`, `apps/api/src/index.ts` |
| Auth | `apps/api/src/lib/auth.ts`, `apps/api/src/routes/auth.ts`, Prisma `users.sessionVersion` |
| Settings | `apps/api/src/routes/settings.ts`, decrypt helper |
| Docker | `docker-compose.yml`, `docker-compose.public.yml`, `Caddyfile`, `docs/docker.md` |
| CI | `.github/workflows/ci.yml` |
| Tests | `apps/api/src/routes/__tests__/`, `apps/api/src/lib/secrets/__tests__/` |
| Env | `.env.example`, `apps/api/.env.example` |

---

## Out of scope (this phase)

- PostgreSQL / managed database migration
- OAuth / social login
- Email verification or password reset via email
- WAF, DDoS protection, or paid CDN
- Horizontal multi-instance scaling with shared rate-limit store
- Penetration test or formal security audit
- Encrypting AI Usage History `input`/`output` at rest (document risk; defer)
- Admin panel for operator metrics

---

## Phase completion checklist

- [ ] HTTPS public deployment documented and verified on a staging domain
- [ ] API keys encrypted at rest; migration path tested
- [ ] Rate limits active on auth and AI routes
- [ ] Session invalidation on password change; production secret validation
- [ ] Backup/restore scripts documented and tested
- [ ] CI workflow running unit + integration tests
- [ ] `docs/specification.md` Deployment section updated
- [ ] `docs/technology.md` security sections updated
- [ ] Phase marked `[x]` in specification with outcome date
