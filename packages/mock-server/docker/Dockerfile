FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

# Set rights for the node user
RUN chown -R node:node /app

# Copy built artifacts (dependencies are bundled, so we only need the entrypoint)
COPY --chown=node:node dist/docker-entrypoint.js docker-entrypoint.js

# Create mount point for OpenAPI documents
RUN mkdir -p /docs && chown node:node /docs

# Create temp directory for downloaded documents
RUN mkdir -p /tmp && chown node:node /tmp

EXPOSE 3000

# Switch to the non-root user
USER node

# Use docker-entrypoint.js as the entrypoint
ENTRYPOINT ["node", "docker-entrypoint.js"]
