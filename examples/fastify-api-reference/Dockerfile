ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

COPY examples/fastify-api-reference ./examples/fastify-api-reference

RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store \
    pnpm --filter "@scalar-examples/fastify-api-reference" install --frozen-lockfile && \
    pnpm --filter "@scalar-examples/fastify-api-reference" build


FROM node:18-bullseye-slim AS runner
WORKDIR /app
RUN npm install -g pnpm
ENV NODE_ENV production

# Copy root node modules and any utilized packages with least-privledge user
COPY --from=builder --chown=node:node /app/node_modules /app/node_modules
COPY --from=builder --chown=node:node /app/packages/api-reference /app/packages/api-reference
COPY --from=builder --chown=node:node /app/packages/fastify-api-reference /app/packages/fastify-api-reference
COPY --from=builder --chown=node:node /app/examples/fastify-api-reference /app/examples/fastify-api-reference

WORKDIR /app/examples/fastify-api-reference

# Cloud build requires port 8080 to be exposed
EXPOSE 8080
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

# Run the app as non-root leat-privledge user
USER node
CMD ["node", "dist/index.js"]

