#!/bin/bash

pnpm concurrently \
    --prefix none \
    " \
        pnpm \
            --workspace-concurrency=100 \
            --filter @scalar-examples/web \
            --filter @scalar-examples/react \
            --filter @scalar-examples/api-client-proxy \
            --filter @scalar-examples/echo-server \
            --filter @scalar-examples/fastify-api-reference \
            --filter @scalar-examples/hono-api-reference \
            --filter @scalar-examples/express-api-reference \
            dev \
    " \
    " \
        pnpm \
            --workspace-concurrency=100 \
            --filter @scalar/api-reference \
            --filter @scalar/components \
            storybook --no-open \
    "
