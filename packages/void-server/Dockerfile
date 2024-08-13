ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

ENV BUILD_PLAYGROUND=1

# process init system
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init
RUN npm install pnpm@9.2.0 --global
RUN pnpm config set store-dir ~/.pnpm-store

# Copy and build the void server package
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY package.json .
COPY tsconfig.json .
COPY turbo.json .
COPY packages/build-tooling ./packages/build-tooling
COPY packages/void-server ./packages/void-server

RUN pnpm --filter @scalar/void-server install --frozen-lockfile && \
    pnpm --filter @scalar/void-server build


FROM node:18-bullseye-slim AS runner
# Copy from the previous stage to keep this image minimal
COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init

ENV NODE_ENV=production
ENV PORT=$PORT

# Use default non-root user from the node image
USER node
WORKDIR /app
RUN chown node:node /app

# Copy root node modules and any utilized packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/void-server /app/packages/void-server

WORKDIR /app/packages/void-server

CMD ["dumb-init", "node", "dist/playground/index.js"]
