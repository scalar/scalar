# ARG BASE_IMAGE
# FROM ${BASE_IMAGE} AS builder
# WORKDIR /app

FROM node:18-bullseye AS base

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
RUN pnpm install
RUN pnpm turbo \
    run build \
    --filter='./packages/*' \
    # … don’t build too many in parallel, we don’t want to hit a memory limit.
    --concurrency=2

FROM base AS builder

# process init system
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

RUN npm install pnpm@9.2.0 --global
RUN pnpm config set store-dir ~/.pnpm-store

WORKDIR /app

# Copy and build the void server package
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY package.json .
COPY tsconfig.json .
COPY turbo.json .
COPY packages/build-tooling ./packages/build-tooling
COPY packages/void-server ./packages/void-server
COPY examples/void-server ./examples/void-server

RUN pnpm --filter @scalar-examples/void-server install --frozen-lockfile && \
    pnpm --filter @scalar-examples/void-server build


FROM node:18-bullseye-slim AS runner
# Copy from the previous stage to keep this image minimal
COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init

ENV NODE_ENV=production

# Use default non-root user from the node image
USER node
WORKDIR /app
RUN chown node:node /app

# Copy root node modules and any utilized packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/void-server /app/packages/void-server
COPY --from=builder /app/examples/void-server /app/examples/void-server

WORKDIR /app/examples/void-server

# Set the PORT environment variable for the node server
ENV PORT=$PORT

CMD ["dumb-init", "node", "dist/index.js"]




