FROM node:18-bullseye AS base

RUN npm install pnpm@8 --global
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
RUN pnpm build:packages
FROM base AS builder
WORKDIR /app

# Copy everything but only install and build the main package and its dependencies
COPY examples/fastify-api-reference ./examples/fastify-api-reference

# Install and build the main package and its dependencies
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store \
    pnpm --filter "@scalar-examples/fastify-api-reference" install && \
    pnpm --filter "@scalar-examples/fastify-api-reference" build


FROM node:18-bullseye-slim AS runner

RUN npm install -g pnpm
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify

# Set the correct permission for prerender cache
RUN mkdir app
RUN chown fastify:nodejs app

WORKDIR /app

# Copy root node modules and any utilized packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/components /app/packages/components
COPY --from=builder /app/packages/themes /app/packages/themes
COPY --from=builder /app/packages/oas-utils /app/packages/oas-utils
COPY --from=builder /app/packages/build-tooling /app/packages/build-tooling
COPY --from=builder /app/packages/api-reference /app/packages/api-reference
COPY --from=builder /app/packages/fastify-api-reference /app/packages/fastify-api-reference
COPY --from=builder /app/examples/fastify-api-reference /app/examples/fastify-api-reference


WORKDIR /app/examples/fastify-api-reference

CMD ["dumb-init", "node", "dist/index.js"]
