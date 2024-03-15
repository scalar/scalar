FROM node:20

FROM mcr.microsoft.com/playwright:v1.42.1-jammy

# Set the work directory for the application
WORKDIR /app

# Install and enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY package.json /app/
COPY tests /app/
COPY tsconfig.json /app/
COPY playwright.config.ts /app/

# Get the needed libraries to run Playwright
RUN apt-get update && apt-get -y install libnss3 libatk-bridge2.0-0 libdrm-dev libxkbcommon-dev libgbm-dev libasound-dev libatspi2.0-0 libxshmfence-dev

RUN pnpm install






