ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

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
COPY examples/nestjs-api-reference-express ./examples/nestjs-api-reference-express

RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store \
    pnpm --filter @scalar-examples/nestjs-api-reference-express install --frozen-lockfile && \
    pnpm --filter @scalar-examples/nestjs-api-reference-express build

FROM node:18-bullseye-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

RUN npm install -g pnpm
ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Set the correct permission for the build
RUN mkdir app

RUN chown nestjs:nodejs app

WORKDIR /app

# Copy root node modules and any utilized packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/components /app/packages/components
COPY --from=builder /app/packages/themes /app/packages/themes
COPY --from=builder /app/packages/oas-utils /app/packages/oas-utils
COPY --from=builder /app/packages/build-tooling /app/packages/build-tooling
COPY --from=builder /app/packages/api-reference /app/packages/api-reference
COPY --from=builder /app/packages/nestjs-api-reference /app/packages/nestjs-api-reference
COPY --from=builder /app/examples/nestjs-api-reference-express /app/examples/nestjs-api-reference-express

WORKDIR /app/examples/nestjs-api-reference-express

USER nestjs

CMD ["dumb-init", "node", "dist/main.js"]
