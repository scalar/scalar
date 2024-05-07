# Build image
FROM golang:1.22-alpine as build
WORKDIR /app

COPY ./main.go ./
RUN go build main.go

# Build distroless image
FROM gcr.io/distroless/static-debian11
ENV PORT=9033

# Copy the compiled app binary
COPY --from=build --chown=1001:1001 /app/main /app/

# Run as non-root user
USER 1001:1001

CMD [ "/app/main" ]
