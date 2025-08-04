FROM mcr.microsoft.com/playwright:v1.49.1-noble

# Install and enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm

# Copy the necessary files for the build
COPY turbo.json /app/turbo.json
COPY tsconfig.json /app/tsconfig.json
COPY pnpm-lock.yaml /app/pnpm-lock.yaml
COPY pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY package.json /app/package.json

COPY packages /app/packages

COPY integrations/hono /app/integrations/hono
COPY integrations/nextjs /app/integrations/nextjs

# Go to the api-reference package
WORKDIR /app/packages/api-reference

# Install the dependencies
RUN pnpm install

RUN cd /app/packages/build-tooling && pnpm build
RUN cd /app/packages/openapi-types && pnpm build
RUN cd /app/packages/types && pnpm build
RUN cd /app/packages/core && pnpm build
