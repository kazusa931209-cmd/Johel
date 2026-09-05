# Phase 33 — Docker Environment

**Performed:** 2026-09-06  
**Status:** Finished

## Goal

Run JoHEL from **one Docker image** (API + web) on **Docker Desktop** (Apple Silicon). Publish port **4041** for LAN access. Persist SQLite in a named volume on the host that runs the container. Support **Case A** (local Desktop) and **Case B** (other Mac via `docker save` / `load`).

## Delivered

- `Dockerfile` (multi-stage, `linux/arm64`), `.dockerignore`, `docker-entrypoint.sh`, `docker-compose.yml`, root `.env.example`
- API `HOST` env for listen address; Next `output: "standalone"` + `outputFileTracingRoot`
- [`docs/docker.md`](../docker.md) deployment guide; updates to `specification.md`, `technology.md`, `README.md`

## Out of scope

- Container registry; bind-mounting SQLite to macOS; moving volume data between hosts
