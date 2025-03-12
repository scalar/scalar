ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

# Build the package
RUN pnpm --filter @scalar/snippetz build:playground

FROM node:20-bullseye-slim AS runner
# install simple http server for serving static content
RUN npm install -g http-server

# Use default non-root user from the node image
USER node
WORKDIR /app
RUN chown node:node /app

# Copy root node modules and any utilized packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages /app/packages
WORKDIR /app/packages/snippetz

CMD ["http-server", "playground/dist"]
