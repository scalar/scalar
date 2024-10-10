ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

# Build the package
RUN pnpm --filter scalar-api-client build:open

FROM node:20-bullseye-slim AS runner
# install simple http server for serving static content
RUN npm install -g http-server

ENV NODE_ENV=production

# Use default non-root user from the node image
USER node
WORKDIR /app
RUN chown node:node /app

# Copy root node modules and any utilized packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/components /app/packages/components
COPY --from=builder /app/packages/themes /app/packages/themes
COPY --from=builder /app/packages/api-client /app/packages/api-client
COPY --from=builder /app/projects/app /app/projects/app
WORKDIR /app/projects/app


CMD ["http-server", "open/dist"]
