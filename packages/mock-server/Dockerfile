# ARG BASE_IMAGE
# FROM ${BASE_IMAGE} AS builder
# WORKDIR /app

FROM node:18-bullseye AS base

RUN npm install pnpm@9.2.0 --global
RUN pnpm config set store-dir ~/.pnpm-store
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

WORKDIR /app

# Copy and build all packages to share across example builds
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY package.json .
COPY tsconfig.json .
COPY turbo.json .
COPY packages ./packages
RUN pnpm install
RUN pnpm turbo \
    run build \
    --filter='./packages/*' \
    # … don’t build too many in parallel, we don’t want to hit a memory limit.
    --concurrency=2

FROM base AS builder
WORKDIR /app

ENV BUILD_PLAYGROUND=1

# Build the package with the BUILD_PLAYGROUND flag set
RUN pnpm --filter @scalar/mock-server build

FROM node:20-bullseye-slim AS runner
COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init

ENV NODE_ENV=production

# Use default non-root user from the node image
USER node
WORKDIR /app
RUN chown node:node /app

# Copy root node modules and any utilized packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/galaxy /app/packages/galaxy
COPY --from=builder /app/packages/mock-server /app/packages/mock-server
WORKDIR /app/packages/mock-server

CMD ["dumb-init", "node", "dist/playground/index.js"]
