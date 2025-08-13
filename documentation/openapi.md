# OpenAPI Specification

We're expecting the passed OpenAPI document to adhere to [the Swagger 2.0, OpenAPI 3.0 or OpenAPI 3.1 specification](https://github.com/OAI/OpenAPI-Specification).

On top of that, we've added a few things for your convenience:

## Custom Specification Extensions

You can add custom specification extensions (starting with a `x-`) through [our plugin API](configuration.md).

## x-scalar-environments

You can specify predefined environment variables for the API Client/References to consume and use:

```yaml
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

You can also specify the default active environment a user will have :) if there's none set here we pick the first from the `x-scalar-environments` to be the default

```
x-scalar-active-environment: staging
```

## x-codeSamples

We provide examples for a lot of popular HTTP clients and frameworks. For something completely custom, for example to show the use of your own SDK, you can use `x-codeSamples`:

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

OpenAPI allows description of "additionalProperties" that may be included in a schema. Their names are unknown, but the field types can be added to the API description so that producers and consumers understand whether additional fields are permitted and any additional rules that apply.

Since the field names are not specified, they are displayed with a generic name in the API reference documentation. Use `x-additionalPropertiesName` to display a more meaningful name in this scenario.

The following example shows a schema that accepts any fields as long as the values are numbers between 0-100, for a set of sensors reporting fill levels:

```yaml
components:
  schemas:
    FillLevel:
      type: object
      properties:
        reportTime:
          type: string
          format: date-time
          description: Report creation time.
      required:
        - reportTime
      additionalProperties:
        x-additionalPropertiesName: percentage
        type: integer
        minimum: 0
        maximum: 100
```

The additional properties appear in the documentation as `percentage*`.

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

## x-badges

You can add badges to operations to use as indicators in documentation. Each operation can have multiple badges, and the displayed color is also configurable. The following example sets badges on the GET `/hello-world` operation:

```diff
openapi: 3.1.0
info:
  title: x-badges
  version: 1.0.0
paths:
  /hello-world:
    get:
      summary: Hello World
+      x-badges:
+        - name: 'Alpha'
+        - name: 'Beta'
+          position: before
+        - name: 'Gamma'
+          position: after
+          color: '#ffcc00'
```

| Option   | Type   | Description                                                                                                                 |
| -------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| name     | string | **REQUIRED**. The text that displays in the badge.                                                                          |
| position | string | The position of the badge in relation to the header. Possible values: `before`, `after`. The default value is `after`.      |
| color    | string | The color of the badge. It can be defined in various formats such as color keywords, RGB, RGBA, HSL, HSLA, and Hexadecimal. |

## x-enum-descriptions

You can add a descriptions to `enum` values with `x-enum-descriptions`:

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
+      x-enum-descriptions:
+        missing_features: Missing features
+        too_expensive: Too expensive
+        unused: Unused
+        other: Other
```

Aliases: `x-enumDescriptions`

## x-enum-varnames

You can provide variable names for `enum` values with `x-enum-varnames`. These names will be displayed alongside the enum values in the format `value = varname`:

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
components:
  schemas:
    HttpStatusCode:
      type: integer
      enum:
      - 100
      - 200
      - 300
      - 400
      - 500
+      x-enum-varnames:
+      - Continue
+      - OK
+      - MultipleChoices
+      - BadRequest
+      - InternalServerError
```

This will display as: `100 = Continue`, `200 = OK`, `300 = MultipleChoices`, etc.

Aliases: `x-enumNames`

## x-scalar-sdk-installation

We generate custom code examples for all languages, but you might have a custom SDK for your API. Provide installation instructions in the header like shown in the example below.

You can use `description` (supports Markdown) or `source` (for shell scripts) or both.

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
  x-scalar-sdk-installation:
  - lang: Node
    description: Install our **Custom SDK** for Node.js from npm:
    source: |-
      npm install @your-awesome-company/sdk
```
