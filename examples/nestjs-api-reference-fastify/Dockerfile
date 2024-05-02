ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

# Install dumb-init - minimal process init system
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

# Copy everything from the base
# only install and build the main package and its dependencies
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY package.json .
COPY tsconfig.json .
COPY packages/api-reference ./packages/api-reference
COPY packages/components ./packages/components
COPY packages/themes ./packages/themes
COPY packages/oas-utils ./packages/oas-utils
COPY packages/build-tooling ./packages/build-tooling
COPY packages/nestjs-api-reference ./packages/nestjs-api-reference
COPY examples/nestjs-api-reference-fastify ./examples/nestjs-api-reference-fastify

# Mount the cache where pnpm expects it and build the main package
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store \
    pnpm --filter @scalar-examples/nestjs-api-reference-fastify install --frozen-lockfile && \
    pnpm --filter @scalar-examples/nestjs-api-reference-fastify build

FROM node:18-bullseye-slim AS runner

# Copy from the previous stage to keep this image minimal
COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init

ENV NODE_ENV production
# Set the PORT environment variable for the node server
ENV PORT $PORT
ENV HOST '0.0.0.0'

# Use default non-root user from the node image
USER node
WORKDIR /app
RUN chown node:node /app

# Copy root node modules and any utilized packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/nestjs-api-reference /app/packages/nestjs-api-reference
COPY --from=builder /app/examples/nestjs-api-reference-fastify /app/examples/nestjs-api-reference-fastify

WORKDIR /app/examples/nestjs-api-reference-fastify
# dumb-init runs as PID 1 and ensures all signals are forwarded
# to the spawned node process (ensures the server receives terminate signal)
CMD ["dumb-init", "node", "dist/main.js"]
