ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

ENV BUILD_PLAYGROUND=1

# Build the package with the BUILD_PLAYGROUND flag set
RUN pnpm --filter @scalar/void-server build

FROM node:20-bullseye-slim AS runner
COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init

ENV NODE_ENV=production

# Use default non-root user from the node image
USER node
WORKDIR /app
RUN chown node:node /app

# Copy root node modules and any utilized packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages /app/packages
WORKDIR /app/packages/void-server

CMD ["dumb-init", "node", "dist/playground/index.js"]
