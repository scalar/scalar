ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

# Copy everything but only install and build the main package and its dependencies
COPY examples/nextjs-api-reference ./examples/nextjs-api-reference

# Install and build the main package and its dependencies
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store \
    pnpm --filter "@scalar-examples/nextjs-api-reference" install && \
    pnpm --filter "@scalar-examples/nextjs-api-reference" build


FROM node:18-bullseye-slim AS runner
WORKDIR /app
RUN npm install -g pnpm
ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Get the nextjs build files
# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/examples/nextjs-api-reference/.next/standalone/ ./
COPY --from=builder --chown=nextjs:nodejs /app/examples/nextjs-api-reference/.next/static ./.next/static

# Path for the standalone output for the nextjs example (contents of .next/standalone)
WORKDIR /app/examples/nextjs-api-reference

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
