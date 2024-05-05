ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

# Copy everything but only install and build the main package and its dependencies
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY package.json .
COPY tsconfig.json .
COPY packages/api-reference ./packages/api-reference
COPY packages/components ./packages/components
COPY packages/themes ./packages/themes
COPY packages/oas-utils ./packages/oas-utils
COPY packages/build-tooling ./packages/build-tooling
COPY packages/api-reference-react ./packages/api-reference-react
COPY examples/react ./examples/react

# Install and build the main package and its dependencies
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store \
    pnpm --filter "@scalar-examples/react" install && \
    pnpm --filter "@scalar-examples/react" build

FROM node:18-bullseye-slim AS runner
RUN npm install -g serve

# Use default non-root user from the node image
USER node
WORKDIR /app
RUN chown node:node /app

COPY --from=builder /app/examples/react /app/examples/react

WORKDIR /app/examples/react

# Set the PORT environment variable for the server
ENV PORT $PORT

# Run the server with shell so PORT variable is expanded
CMD ["sh", "-c", "serve -s -l $PORT ./dist"]
