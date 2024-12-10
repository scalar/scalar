ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

# Build the package
RUN pnpm --filter @scalar/snippetz build:playground

# production stage
FROM nginx:stable-alpine AS runner

COPY --from=builder /app/packages/snippetz/playground/dist /usr/share/nginx/html
COPY --from=builder /app/packages/snippetz/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
