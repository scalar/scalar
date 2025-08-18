FROM node:22.18.0-alpine

# Enable corepack to use pnpm
RUN corepack enable

WORKDIR /app

COPY package.json package.json

RUN pnpm install

# Copy application source code
COPY index.js index.js

CMD ["pnpm", "start"]