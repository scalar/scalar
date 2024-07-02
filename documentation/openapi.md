# OpenAPI Specification

We’re expecting the passed specification to adhere to [the Swagger 2.0, OpenAPI 3.0 or OpenAPI 3.1 specification](https://github.com/OAI/OpenAPI-Specification).

On top of that, we’ve added a few things for your convenience:

## x-codeSamples

We provide examples for a lot of popular HTTP clients and frameworks. For something completly custom, for example to show the use of your own SDK, you can use `x-codeSamples`:

```diff
openapi: 3.1.0
info:
  title: Val Town API
  version: '1.0'
paths:
  '/v1/eval':
    post:
+      x-codeSamples:
+      - label: ValTown JS SDK
+        lang: JavaScript
+        source: |-
+          import ValTown from '@valtown/sdk';
+
+          const valTown = new ValTown();
+
+          async function main() {
+            const valRunAnonymousResponse = await valTown.vals.runAnonymous({ code: 'console.log(1);' });
+
+            console.log(valRunAnonymousResponse);
+          }
+
+          main();
```

## x-displayName

You can overwrite tag names with `x-displayName`.

```diff
openapi: 3.1.0
info:
  title: Example
  version: '1.0'
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
  version: '1.0'
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
  version: '1.0'
paths:
  '/planets':
    get:
      summary: Get all planets
    post:
      summary: Create a new planet
+      x-internal: true
```
