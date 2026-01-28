# Scalar API Reference for Effect

Effect is natively integrated with Scalar, making it easy to use together out of the box.

## Usage

```typescript
// https://github.com/Effect-TS/effect/tree/main/packages/platform#registering-a-httpapi
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiScalar,
  HttpLayerRouter
} from "@effect/platform"
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { Effect, Layer } from "effect"
import { createServer } from "http"

// First, we define our HttpApi
class MyApi extends HttpApi.make("api").add(
  HttpApiGroup.make("users")
    .add(HttpApiEndpoint.get("me", "/me"))
    .prefix("/users")
) {}

// Implement the handlers for the API
const UsersApiLayer = HttpApiBuilder.group(MyApi, "users", (handers) =>
  handers.handle("me", () => Effect.void)
)

// Use `HttpLayerRouter.addHttpApi` to register the API with the router
const HttpApiRoutes = HttpLayerRouter.addHttpApi(MyApi, {
  openapiPath: "/docs/openapi.json"
}).pipe(
  // Provide the api handlers layer
  Layer.provide(UsersApiLayer)
)

// Create a /docs route for the API documentation
const DocsRoute = HttpApiScalar.layerHttpLayerRouter({
  api: MyApi,
  path: "/docs"
})

// Finally, we merge all routes and serve them using the Node HTTP server
const AllRoutes = Layer.mergeAll(HttpApiRoutes, DocsRoute).pipe(
  Layer.provide(HttpLayerRouter.cors())
)

HttpLayerRouter.serve(AllRoutes).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
  Layer.launch,
  NodeRuntime.runMain
)
```
