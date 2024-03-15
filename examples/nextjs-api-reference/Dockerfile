FROM node:20-bullseye-slim AS base
# Setup pnpm and turbo on the base image
RUN npm install pnpm turbo --global
RUN pnpm config set store-dir ~/.pnpm-store

# Prune projects
FROM base AS pruner
ARG PROJECT
WORKDIR /app
COPY . .
RUN turbo prune @scalar-examples/nextjs-api-reference --docker

# Build the project
FROM base AS builder
ARG PROJECT
WORKDIR /app

# Copy lockfile and package.json's of isolated subworkspace
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/tsconfig.json ./tsconfig.json

# Install the dependencies
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm install --frozen-lockfile

# Copy the source code of the isolated subworkspace
COPY --from=pruner /app/out/full/ .

# RUN pnpm build --filter=@scalar-examples/nextjs-api-reference
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm install --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm run build --filter=@scalar-examples/nextjs-api-reference

# Final image
FROM base AS runner
ARG PROJECT
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/examples/nextjs-api-reference/.next/standalone ./.next/standalone
COPY --from=builder --chown=nextjs:nodejs /app/examples/nextjs-api-reference/.next/static ./.next/static

WORKDIR /app/.next/standalone/examples/nextjs-api-reference

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME localhost

CMD ["node", "server.js"]
