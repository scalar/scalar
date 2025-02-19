ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

# Copy everything but only install and build the main package and its dependencies
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY package.json .
COPY tsconfig.json .
COPY packages/api-reference ./packages/api-reference
COPY packages/galaxy ./packages/galaxy
COPY packages/api-reference-react ./packages/api-reference-react

# Install and build the main package and its dependencies
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store \
    pnpm --filter "@scalar-examples/react" install && \
    pnpm --filter "@scalar-examples/react" build

FROM node:20-slim AS runner

# install simple http server for serving the content
RUN npm i -g serve

# Use default non-root user from the node image
USER node
WORKDIR /app
RUN chown node:node /app

COPY --from=builder app/packages/api-reference-react packages/api-reference-react
WORKDIR /app/packages/api-reference-react/playground

CMD ["serve", "-s", "dist"]
