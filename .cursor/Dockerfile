FROM node:24-bookworm

SHELL ["/bin/bash", "-lc"]

# Keep the base image minimal while ensuring standard git/ssh workflows work.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    openssh-client \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable \
  && corepack prepare pnpm@10.16.1 --activate
