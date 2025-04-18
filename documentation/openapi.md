# OpenAPI Specification

We’re expecting the passed OpenAPI document to adhere to [the Swagger 2.0, OpenAPI 3.0 or OpenAPI 3.1 specification](https://github.com/OAI/OpenAPI-Specification).

On top of that, we’ve added a few things for your convenience:

## Custom Specification Extensions

You an add custom specification extensions (starting with a `x-`) through [our plugin API](configuration.md).

## x-scalar-environments

You can specify predefined environment variables for the API Client/References to consume and use:

```
x-scalar-environments:
  production:
    description: "Production environment"
    color: "#0082D0"
    # Variables are saved directly to the specification
    variables:
      userId:
        description: "User ID"
        default: "1234567890"
      apiUrl:
        description: "API URL"
        default: "https://api.production.example.com"
  staging:
    description: "Staging environment"
    variables:
      userId: "1234567890"
      apiUrl:
        description: "API URL"
        default: "https://api.staging.example.com"
```

## x-scalar-active-environment

You can also specify the default active environment a user will have :) if theres none set here we pick the first from the `x-scalar-environments` to be the default

```
x-scalar-active-environment: staging
```

## x-codeSamples

We provide examples for a lot of popular HTTP clients and frameworks. For something completly custom, for example to show the use of your own SDK, you can use `x-codeSamples`:

```diff
openapi: 3.1.0
info:
  title: Val Town API
  version: 1.0
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
  version: 1.0
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

## x-tagGroups

You can group your tags with `x-tagGroups`.

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
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

## x-scalar-ignore

You can hide operations and webhooks from the reference with `x-scalar-ignore`.

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
paths:
  '/planets':
    get:
      summary: Get all planets
    post:
      summary: Create a new planet
+      x-scalar-ignore: true
```

Or to hide a tag and the operations under it:

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
tags:
  - name: planets
+    x-scalar-ignore: true
paths:
  '/planets':
    get:
      summary: Get all planets
      tags:
        - planets
    post:
      summary: Create a new planet
      tags:
        - planets
```

Aliases: `x-internal`

## x-additionalPropertiesName

You can add a custom attribute name to `additionalProperties` with `x-additionalPropertiesName`.

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
components:
  schemas:
    Planet:
      required:
        - name
      properties:
        name:
          type: string
      additionalProperties:
+        x-additionalPropertiesName: anyCustomAttribute
        type: string
```

## x-scalar-stability

You can show the stability of an endpoint by settings the `x-scalar-stability` to either `stable`, `experimental` or `deprecated`. The native `deprecated` property will take precedence.

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
paths:
  '/planets':
    get:
      summary: Get all planets
    post:
      summary: Create a new planet
+      x-scalar-stability: 'experimental'
```

## x-enumDescriptions

You can add a descriptions to `enum` values with `x-enumDescriptions`:

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
components:
  schemas:
    CustomerCancellationReason:
      type: string
      enum:
      - missing_features
      - too_expensive
      - unused
      - other
+      x-enumDescriptions:
+        missing_features: Missing features
+        too_expensive: Too expensive
+        unused: Unused
+        other: Other
```

## x-scalar-sdk-installation

We generate custom code examples for all languages, but you might have a custom SDK for your API. Provide installation instructions in the header like shown in the example below.

You can use `description` (supports Markdown) or `source` (for shell scripts) or both.

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
+  x-scalar-sdk-installation:
+  - lang: Node
+    description: Install our **Custom SDK** for Node.js from npm:
+    source: |-
+      npm install @your-awesome-company/sdk
```
