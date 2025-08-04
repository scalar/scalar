FROM mcr.microsoft.com/playwright:v1.49.1-noble

# Install and enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm

# Install the necessary libraries for Playwright
#RUN apt-get update && apt-get -y install libnss3 libatk-bridge2.0-0 libdrm-dev libxkbcommon-dev libgbm-dev libasound-dev libatspi2.0-0 libxshmfence-dev

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
