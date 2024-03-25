#!/bin/bash

pnpm concurrently \
    --prefix none \
    " \
        pnpm \
            --workspace-concurrency=100 \
            --filter @scalar-examples/web \
            --filter @scalar-examples/react \
            --filter @scalar/proxy-server \
            --filter @scalar-examples/cdn-api-reference \
            --filter @scalar-examples/echo-server \
            --filter @scalar-examples/fastify-api-reference \
            --filter @scalar-examples/hono-api-reference \
            --filter @scalar-examples/express-api-reference \
            --filter @scalar-examples/nestjs-api-reference \
            --filter @scalar-examples/nextjs-api-reference \
            --filter @scalar-examples/nestjs-api-reference-express \
            --filter @scalar-examples/nestjs-api-reference-fastify \
            dev \
    " #\
    # Commented this out as storybook is currently broken
    # " \
    #     pnpm \
    #         --workspace-concurrency=100 \
    #         --filter @scalar/api-reference \
    #         --filter @scalar/components \
    #         storybook --no-open \
    # "
