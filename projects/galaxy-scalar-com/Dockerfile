ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

RUN pnpm --filter galaxy-scalar-com build

FROM node:20-bullseye-slim AS runner
COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init

ENV NODE_ENV=production

# Use default non-root user from the node image
USER node
WORKDIR /app
RUN chown node:node /app

# Copy root node modules and any utilized packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/integrations/hono /app/integrations/hono
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/projects/galaxy-scalar-com /app/projects/galaxy-scalar-com

WORKDIR /app/projects/galaxy-scalar-com

CMD ["dumb-init", "node", "dist/index.js"]
