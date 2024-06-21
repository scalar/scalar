# OpenAPI Specification

We’re expecting the passed specification to adhere to [the Swagger 2.0, OpenAPI 3.0 or OpenAPI 3.1 specification](https://github.com/OAI/OpenAPI-Specification).

On top of that, we’ve added a few things for your convenience:

## x-displayName

You can overwrite tag names with `x-displayName`.

```diff
openapi: 3.1.0
info:
  title: Example
  version: "1.0"
tags:
  - name: pl4n3t5
+    x-displayName: planets
paths:
  '/planets':
    get:
      summary: Get all planets
      tags:
        - pl4n3t5
```

## x-tagGroup

You can group your tags with `x-tagGroup`.

```diff
openapi: 3.1.0
info:
  title: Example
  version: "1.0"
tags:
  - name: planets
+x-tagGroups:
+  - name: galaxy
+    tags:
+      - planets
paths:
  '/planets':
    get:
      summary: Get all planets
      tags:
        - planets
```

## x-internal

You can hide operations from the reference with `x-internal`.

```diff
openapi: 3.1.0
info:
  title: Example
  version: "1.0"
paths:
  '/planets':
    get:
      summary: Get all planets
    post:
      summary: Create a new planet
+      x-internal: true
```
