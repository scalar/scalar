---
'@scalarapi/docker-api-reference': patch
---

feat(docker): add `BASE_PATH` environment variable so the Docker image can be hosted under a subpath (for example, `/docs`). When set, the container prefixes the client-side `configuration.json` fetch URL and the generated `openapi/*` document URLs so they resolve correctly behind a reverse proxy or ingress that exposes Scalar under a non-root path.
