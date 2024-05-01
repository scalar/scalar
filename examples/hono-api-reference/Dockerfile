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

COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY package.json .
COPY tsconfig.json .
COPY packages/api-reference ./packages/api-reference
COPY packages/components ./packages/components
COPY packages/themes ./packages/themes
COPY packages/oas-utils ./packages/oas-utils
COPY packages/build-tooling ./packages/build-tooling
COPY packages/hono-api-reference ./packages/hono-api-reference
COPY examples/hono-api-reference ./examples/hono-api-reference

RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store \
    pnpm --filter @scalar-examples/hono-api-reference install --frozen-lockfile && \
    pnpm --filter @scalar-examples/hono-api-reference build

FROM node:18-bullseye-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

RUN npm install -g pnpm
ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 honojs

# Set the correct permission for the build
RUN mkdir app

RUN chown honojs:nodejs app

WORKDIR /app

# Copy root node modules and any utilized packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/components /app/packages/components
COPY --from=builder /app/packages/themes /app/packages/themes
COPY --from=builder /app/packages/oas-utils /app/packages/oas-utils
COPY --from=builder /app/packages/build-tooling /app/packages/build-tooling
COPY --from=builder /app/packages/api-reference /app/packages/api-reference
COPY --from=builder /app/packages/hono-api-reference /app/packages/hono-api-reference
COPY --from=builder /app/examples/hono-api-reference /app/examples/hono-api-reference

WORKDIR /app/examples/hono-api-reference

USER honojs

CMD ["dumb-init", "node", "dist/index.js"]
