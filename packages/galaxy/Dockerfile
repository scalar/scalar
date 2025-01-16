ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

ENV BUILD_PLAYGROUND=1

# Build the package with the BUILD_PLAYGROUND flag set
RUN pnpm --filter @scalar/galaxy build

FROM node:20-bullseye-slim AS runner
COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init

ENV NODE_ENV=production

# Use default non-root user from the node image
USER node
WORKDIR /app
RUN chown node:node /app

# Copy root node modules and any utilized packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/mock-server /app/packages/mock-server
COPY --from=builder /app/integrations/hono /app/integrations/hono
COPY --from=builder /app/packages/oas-utils /app/packages/oas-utils
COPY --from=builder /app/packages/openapi-parser /app/packages/openapi-parser
COPY --from=builder /app/packages/galaxy /app/packages/galaxy
WORKDIR /app/packages/galaxy

CMD ["dumb-init", "node", "dist/playground/index.js"]
