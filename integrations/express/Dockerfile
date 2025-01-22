ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

# Install dumb-init - minimal process init system
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init
RUN pnpm --filter @scalar/express-api-reference build:playground

FROM node:20-bullseye-slim AS runner
# Copy from the previous stage to keep this image minimal
COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init

ENV NODE_ENV=production
# Set the PORT environment variable for the node server
ENV PORT=$PORT
ENV HOST='0.0.0.0'

# Use default non-root user from the node image
USER node
WORKDIR /app
RUN chown node:node /app

# Copy root node modules and any utilized packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/integrations/express /app/integrations/express

WORKDIR /app/integrations/express/playground

# dumb-init runs as PID 1 and ensures all signals are forwarded
# to the spawned node process (ensures the server shuts down gracefully)
CMD ["dumb-init", "node", "dist/index.js"]
