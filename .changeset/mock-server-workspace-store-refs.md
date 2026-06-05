---
'@scalar/mock-server': patch
---

chore(mock-server): resolve OpenAPI references with `@scalar/workspace-store` instead of `@scalar/openapi-parser`

The mock server no longer eagerly dereferences the whole document. It now keeps `$ref` nodes intact via the `@scalar/json-magic` magic proxy and resolves them lazily with `getResolvedRef`/`getResolvedRefDeep` from `@scalar/workspace-store`. The `/openapi.{json,yaml}` endpoints use `@scalar/json-magic` and `yaml` for normalization and serialization. This drops the `@scalar/openapi-parser` dependency. Behavior is unchanged.
