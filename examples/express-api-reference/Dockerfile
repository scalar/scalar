FROM node:18-bullseye-slim as base
RUN npm install pnpm --global
RUN pnpm config set store-dir ~/.pnpm-store

FROM base AS builder
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
COPY packages/express-api-reference ./packages/express-api-reference
COPY examples/express-api-reference ./examples/express-api-reference

RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store \
    pnpm --filter @scalar-examples/express-api-reference install --frozen-lockfile && \
    pnpm --filter @scalar-examples/express-api-reference build


# examples  node_modules	package.json  packages	pnpm-lock.yaml	pnpm-workspace.yaml  tsconfig.json

FROM node:18-bullseye-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

RUN npm install -g pnpm
ENV NODE_ENV production

WORKDIR /app

# Copy root node modules and any utilized packages
COPY --from=builder --chown=node:node /app/node_modules /app/node_modules
COPY --from=builder --chown=node:node /app/packages/components /app/packages/components
COPY --from=builder --chown=node:node /app/packages/themes /app/packages/themes
COPY --from=builder --chown=node:node /app/packages/oas-utils /app/packages/oas-utils
COPY --from=builder --chown=node:node /app/packages/build-tooling /app/packages/build-tooling
COPY --from=builder --chown=node:node /app/packages/api-reference /app/packages/api-reference
COPY --from=builder --chown=node:node /app/packages/express-api-reference /app/packages/express-api-reference
COPY --from=builder --chown=node:node /app/examples/express-api-reference /app/examples/express-api-reference

WORKDIR /app/examples/express-api-reference

ARG PORT=5055
ENV PORT=${PORT}
ENV NODE_ENV=production
EXPOSE ${PORT}

CMD ["dumb-init", "node", "dist/index.js"]
