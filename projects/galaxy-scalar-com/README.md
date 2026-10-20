# Galaxy Scalar Project

This project provides the playground for the mock server and is hosted at [`galaxy.scalar.com`](https://galaxy.scalar.com).

It is deployed to Cloudflare Pages. Releases deploy to production (`galaxy.scalar.com`); other commits to `main` deploy to staging (`galaxy.staging.scalar.com`).

The same Pages worker serves the OpenAPI mock and the Galaxy AsyncAPI WebSocket channels. The reference UI loads `/asyncapi.json`, which points to the current deployment host, including staging, PR previews, and local development.

Connect to `/ws/v1/planets/4/events?api_key=demo` (using `wss` in production or `ws` locally) to receive the document's first planet event example immediately. The user, system, and celestial-body event channels work the same way; `v2` is also supported. Mock authentication accepts a non-empty `api_key` query parameter or bearer token.

Each subscription receives one sample on connection. Samples are independent of REST mutations; this is not a live broadcast service or a simulation of cross-channel request/reply behavior. The existing Cloudflare Pages deployment needs no additional service or bindings.
