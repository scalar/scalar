---
'@scalar/oas-utils': minor
'@scalar/api-client': minor
---

feat: pluggable request transports for client plugins. Plugins can now register custom transports via the new `transports` field on `ClientPlugin`, keyed by document type (`openapi` / `asyncapi`) and target protocol (`http`, `https`, …). When a registration matches the request being executed, its `send(request, context)` implementation replaces the built-in fetch engine while the rest of the pipeline (streaming detection, cookies, response body decoding, plugin hooks) keeps working unchanged. The first matching registration in plugin order wins, an app-level `customFetch` option still takes precedence, and requests executed through a plugin transport bypass the CORS proxy. The `kind: 'http'` discriminator leaves room for session-based channel transports (MQTT, Kafka, …) as a follow-up once the interactive AsyncAPI channel client lands.
