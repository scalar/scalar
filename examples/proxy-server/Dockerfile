# Build image
FROM golang:1.22-alpine as build
WORKDIR /app
COPY src/main.go ./
RUN go build main.go

# Build distroless image
FROM gcr.io/distroless/static-debian11
ENV PORT=9033
COPY --from=build /app/main /app/
CMD [ "/app/main" ]