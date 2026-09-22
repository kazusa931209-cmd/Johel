# syntax=docker/dockerfile:1

FROM --platform=linux/arm64 node:20-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages/resume/package.json packages/resume/
COPY packages/prompt-defaults/package.json packages/prompt-defaults/
COPY packages/jd-meta/package.json packages/jd-meta/

RUN pnpm install --frozen-lockfile --store-dir /pnpm/store --ignore-scripts

COPY apps/web apps/web
COPY packages/resume packages/resume
COPY packages/prompt-defaults packages/prompt-defaults
COPY packages/jd-meta packages/jd-meta

RUN pnpm --filter web exec prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:./prisma/docker-build.db
ENV JWT_SECRET=docker-build-placeholder-min-32-chars
RUN pnpm --filter web build

FROM --platform=linux/arm64 node:20-bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/johel.db
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/apps/web ./apps/web
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 4321

ENTRYPOINT ["/docker-entrypoint.sh"]
