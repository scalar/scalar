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
COPY packages/fastify-api-reference ./packages/fastify-api-reference
COPY examples/fastify-api-reference ./examples/fastify-api-reference

RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store \
    pnpm --filter "@scalar-examples/fastify-api-reference" install --frozen-lockfile && \
    pnpm --filter "@scalar-examples/fastify-api-reference" build


FROM node:18-bullseye-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init
RUN npm install -g pnpm
ENV NODE_ENV production

WORKDIR /app

# Copy root node modules and any utilized packages with least-privledge user
COPY --from=builder --chown=node:node /app/node_modules /app/node_modules
COPY --from=builder --chown=node:node /app/packages/components /app/packages/components
COPY --from=builder --chown=node:node /app/packages/themes /app/packages/themes
COPY --from=builder --chown=node:node /app/packages/oas-utils /app/packages/oas-utils
COPY --from=builder --chown=node:node /app/packages/build-tooling /app/packages/build-tooling
COPY --from=builder --chown=node:node /app/packages/api-reference /app/packages/api-reference
COPY --from=builder --chown=node:node /app/packages/fastify-api-reference /app/packages/fastify-api-reference
COPY --from=builder --chown=node:node /app/examples/fastify-api-reference /app/examples/fastify-api-reference

WORKDIR /app/examples/fastify-api-reference

# Run the app as non-root leat-privledge user
USER node

CMD ["dumb-init", "node", "dist/index.js"]
