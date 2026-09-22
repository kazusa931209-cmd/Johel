# Docker deployment

JoHEL runs as **one Docker image** (Next.js UI + in-process API) on **Docker Desktop** for **macOS Apple Silicon** (`linux/arm64`). Port **4321** is published so **other devices on your LAN** can open the app.

The **database** (SQLite) lives in a Docker Desktop **named volume** on whichever Mac runs the container. When you update the image, **replace the container only** — do not remove the volume.

Full technical notes: [`technology.md`](./technology.md).

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) on an Apple Silicon Mac
- Copy the repo root [`.env.example`](../.env.example) to `.env` and set a strong `JWT_SECRET`

```bash
cp .env.example .env
# edit .env — set JWT_SECRET
```

## Reach the app from other devices

On the Mac that runs Docker Desktop, find its LAN IP (e.g. **System Settings → Network**, or `ipconfig getifaddr en0` in Terminal).

Other devices on the same network open:

```text
http://<LAN-IP-of-host-Mac>:4321
```

If the page does not load from another device, allow incoming connections for Docker Desktop or port **4321** in the Mac firewall.

The API is served on the same port as the UI (`/backend/*`). There is no separate `:4042` process.

---

## Case A — Docker Desktop on this Mac

Build and run on the same machine where you develop. No `docker save` / `docker load`.

### First start

From the repo root:

```bash
docker compose up -d --build
```

Open `http://127.0.0.1:4321` locally, or `http://<this-mac-lan-ip>:4321` from another device.

### Update (code, port, or migrations changed)

Recreate the **container** only. The named volume `johel-data` (database) is **not** removed by these commands:

```bash
docker compose up -d --build --force-recreate
```

Optional: stop the old container first, still without touching the volume:

```bash
docker compose down          # no -v — volume kept
docker compose up -d --build
```

| Safe (volume kept) | Unsafe (deletes database) |
| --- | --- |
| `docker compose up -d --build --force-recreate` | `docker compose down -v` |
| `docker compose down` then `up` (no `-v`) | `docker volume rm …` on `johel-data` |
| `docker compose stop` / `start` | Removing the `johel-data` volume in Docker Desktop |

After a port change (e.g. `4321`), use the same safe update commands above — only the published port mapping changes; `johel-data` is unchanged.

---

## Case B — Docker Desktop on another Mac

Package the image on your dev Mac, run it on a different Mac on the LAN.

### One-time setup on the other Mac

Copy these files to a folder on that Mac (e.g. `~/johel-docker/`):

- `docker-compose.yml`
- `.env` (from `.env.example`, with your `JWT_SECRET`)

Install Docker Desktop on that Mac. You do **not** need the full source tree there after this.

### First deploy (dev Mac)

From the repo root:

```bash
docker compose build
docker save johel:local | gzip > johel-local.tar.gz
```

Copy `johel-local.tar.gz` to the other Mac.

### First start (other Mac)

In the folder with `docker-compose.yml` and `.env`:

```bash
docker load < johel-local.tar.gz
docker compose up -d
```

LAN devices open `http://<other-mac-lan-ip>:4321`.

### Update (code or migrations changed)

**Dev Mac:**

```bash
docker compose build
docker save johel:local | gzip > johel-local.tar.gz
# copy archive to the other Mac
```

**Other Mac:**

```bash
docker load < johel-local.tar.gz
docker compose up -d --force-recreate
```

Again, do **not** use `-v`. The database stays in `johel-data` on **that** Mac.

---

## Keeping the database

| Do | Don't |
| --- | --- |
| `docker compose up -d --force-recreate` when updating the image | `docker compose down -v` (deletes the volume) |
| Keep the volume name `johel-data` | Rename the volume or bind-mount `/data` to a macOS folder |
| Let the container run `prisma migrate deploy` on start | Delete files under `/data` or run `migrate dev` in production |

Migrations run automatically when the container starts. Pending migrations apply to the existing SQLite file at `/data/johel.db`.

**After a migration squash:** if the volume was created with older migration names, `migrate deploy` fails. Remove the volume (`docker compose down -v`) and start again, or keep the volume only if you rebaseline `_prisma_migrations` manually (not documented here).

Keep the same `JWT_SECRET` in `.env` across image updates. Changing it only forces users to log in again; data remains in SQLite.

Each Mac that runs the container has its **own** `johel-data` volume. Case A and Case B are separate databases unless you copy a database file manually (see below).

---

## Replace the Docker database with a local file

Use this when you want the container to use your **local working SQLite file** instead of what is already in the `johel-data` volume — for example, copying `apps/api/prisma/dev.db` from dev into Docker.

| Location | Path |
| --- | --- |
| Local dev (default) | `apps/web/prisma/dev.db` |
| Inside the container | `/data/johel.db` (on volume `johel-data`) |

Run all commands from the **repo root** (Case A) or from the folder that contains `docker-compose.yml` (Case B).

### Recommended — `docker compose cp`

```bash
# Stop the app (volume is kept)
docker compose stop

# Optional — backup the current Docker database
docker compose cp app:/data/johel.db ./johel-docker-backup.db

# Overwrite the container database with your working file
docker compose cp apps/api/prisma/dev.db app:/data/johel.db

# Start again (migrations run on start)
docker compose up -d
```

The Compose service name is `app`. Step three replaces `/data/johel.db` in the volume.

### Alternative — copy via a helper container

Use this if the app container is not available (for example, after `docker compose down`):

```bash
docker compose down   # do NOT pass -v

docker run --rm \
  -v johel_johel-data:/data \
  -v "$(pwd)/apps/api/prisma/dev.db":/backup/dev.db:ro \
  alpine sh -c "cp /backup/dev.db /data/johel.db"

docker compose up -d
```

The volume name may differ. List volumes and use the actual name (often `<project-folder>_johel-data`):

```bash
docker volume ls | grep johel
```

On Case B (another Mac), adjust the source path to wherever your `.db` file lives before running the helper container.

### After replacing

Verify the app is healthy:

```bash
curl -s http://127.0.0.1:4321/backend/health
docker compose logs -f
```

Open `http://127.0.0.1:4321` and confirm your data appears as expected.

### Notes

- **Schema:** The entrypoint runs `prisma migrate deploy` on every start. Your file should match the current migrations (run `pnpm db:migrate` locally first if needed). If migration history is incompatible, see [Keeping the database](#keeping-the-database) above.
- **`JWT_SECRET`:** Replacing the database does not change stored data. A different `JWT_SECRET` in `.env` only forces users to log in again.
- **Do not use `docker compose down -v`:** That deletes the volume and all data.
- **Do not bind-mount the database from macOS:** Keep using the named volume `johel-data` (see [`technology.md`](./technology.md)).

---

## Useful commands

```bash
# Logs
docker compose logs -f

# Stop (volume kept)
docker compose down

# Health (from host)
curl -s http://127.0.0.1:4321/backend/health
```

After Docker Desktop restarts, the container comes back automatically (`restart: unless-stopped`).

---

## Public internet deployment (Phase 83)

Use this when JoHEL should be reachable on the **public internet** with **HTTPS**, encrypted user API keys, rate limiting, and stronger session security.

### Prerequisites

- A VPS or cloud VM with Docker (Apple Silicon `linux/arm64` image as today, or rebuild for your platform later)
- A domain name pointing at the server (`A` / `AAAA` record)
- Root `.env` values:

```bash
PUBLIC_DOMAIN=johel.example.com
ACME_EMAIL=you@example.com
JWT_SECRET=<strong random string, min 32 characters>
ENCRYPTION_KEY=<output of: openssl rand -base64 32>
```

### First start

From the repo root:

```bash
docker compose -f docker-compose.public.yml up -d --build
```

Caddy listens on host ports **4080** (HTTP) and **4443** (HTTPS), mapped to Caddy **80** / **443** inside the container, and proxies to the JoHEL app container on `:4321`. Use non-default host ports when another stack (e.g. a local ingress) already binds **80** / **443**.

Open `https://<PUBLIC_DOMAIN>:4443` (or `http://<PUBLIC_DOMAIN>:4080`).

For direct LAN access without Caddy, the app is also published on **4321** (same as Case A): `http://<LAN-IP>:4321`.

Set `PUBLIC_URL=https://<PUBLIC_DOMAIN>:4443` in `.env` when using the HTTPS port suffix.

### Update

```bash
docker compose -f docker-compose.public.yml up -d --build --force-recreate
```

Do **not** pass `-v`. The `johel-data` volume keeps your database.

### Security notes

- `PUBLIC_DEPLOY=true` requires `JWT_SECRET`, `ENCRYPTION_KEY`, and `TRUST_PROXY=true` inside the app container (set by `docker-compose.public.yml`).
- Session cookies are `Secure` when `TRUST_PROXY=true`.
- User OpenAI API keys are encrypted at rest when `ENCRYPTION_KEY` is set.
- Auth and AI routes are rate-limited server-side.

LAN deployment (`docker compose up`) does not require `ENCRYPTION_KEY` for a fresh database. If the `johel-data` volume was used with public deploy first, keep the same `ENCRYPTION_KEY` in `.env` — `docker-compose.yml` passes it when set so encrypted API keys can be decrypted.

---

## Database backup and restore

Scripts live under `scripts/`:

```bash
# Backup (Docker container name defaults to app-johel)
./scripts/backup-db.sh

# Restore — prompts for RESTORE confirmation
./scripts/restore-db.sh ./backups/johel-20260911-030000.db
```

Environment overrides:

| Variable | Default | Purpose |
| --- | --- | --- |
| `BACKUP_DIR` | `./backups` | Output directory |
| `BACKUP_RETENTION_DAYS` | `14` | Delete older backup files |
| `JOHEL_CONTAINER` | `app-johel` | Docker container name |
| `LOCAL_DB_PATH` | `./apps/api/prisma/dev.db` | Local dev DB when Docker is not running |

**Before upgrading the image**, take a backup. Treat backups as sensitive — they may contain user prompts, job descriptions, and AI usage I/O.
