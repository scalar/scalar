FROM node:20-slim AS base

# process init system and install necessary certificates
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init git ca-certificates && update-ca-certificates

# Set Node.js memory limit to 8GB
ENV NODE_OPTIONS="--max-old-space-size=8192"

RUN npm install pnpm@10.15.1 --global
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
  # … don't build too many in parallel, we don't want to hit a memory limit.
  --concurrency=2
