# Docker deployment

JoHEL runs as **one Docker image** (API + web) on **Docker Desktop** for **macOS Apple Silicon** (`linux/arm64`). Port **4444** is published so **other devices on your LAN** can open the app.

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
http://<LAN-IP-of-host-Mac>:4444
```

If the page does not load from another device, allow incoming connections for Docker Desktop or port **4444** in the Mac firewall.

The API (`:4042`) is **not** published — browsers use the web UI and `/backend/*` proxy only.

---

## Case A — Docker Desktop on this Mac

Build and run on the same machine where you develop. No `docker save` / `docker load`.

### First start

From the repo root:

```bash
docker compose up -d --build
```

Open `http://127.0.0.1:4444` locally, or `http://<this-mac-lan-ip>:4444` from another device.

### Update (code or migrations changed)

```bash
docker compose up -d --build --force-recreate
```

Do **not** pass `-v`. The `johel-data` volume keeps your database.

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

LAN devices open `http://<other-mac-lan-ip>:4444`.

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

Each Mac that runs the container has its **own** `johel-data` volume. Case A and Case B are separate databases unless you back up and restore manually (not covered here).

---

## Useful commands

```bash
# Logs
docker compose logs -f

# Stop (volume kept)
docker compose down

# Health (from host)
curl -s http://127.0.0.1:4444/backend/health
```

After Docker Desktop restarts, the container comes back automatically (`restart: unless-stopped`).
