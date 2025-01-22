FROM node:20-bullseye AS base

# process init system
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

RUN npm install pnpm@9.2.0 --global
RUN pnpm config set store-dir ~/.pnpm-store

WORKDIR /app

# Copy and build all packages to share across example builds
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY package.json .
COPY tsconfig.json .
COPY turbo.json .
COPY packages ./packages
COPY integrations ./integrations
RUN pnpm install
RUN pnpm turbo \
    run build \
    --filter='./packages/*' \
    --filter='./integrations/*' \
    # … don’t build too many in parallel, we don’t want to hit a memory limit.
    --concurrency=2

