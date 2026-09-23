# OpenAPI Specification

We're expecting the passed OpenAPI document to adhere to [the Swagger 2.0, OpenAPI 3.0, OpenAPI 3.1 or OpenAPI 3.2 specification](https://github.com/OAI/OpenAPI-Specification).

On top of that, we've added a few things for your convenience:

## Editor completion and version compatibility

The Scalar App editor offers OpenAPI 3.2 completion and structural diagnostics for documents declaring either OpenAPI 3.1 or 3.2. This permissive editing policy helps you work with newer fields, but the absence of editor errors does not certify that a document conforms to its declared OpenAPI version.

For example, the editor accepts `itemSchema`, `additionalOperations`, and `style: cookie` even when the document still declares `openapi: 3.1.0`. Those fields are not part of OpenAPI 3.1, and tools that validate that version may reject the document. Editor completion does not automatically change the declared version.

Before using OpenAPI 3.2-only fields, migrate the document to OpenAPI 3.2 and explicitly set a matching version such as `openapi: 3.2.0`. Check that your validators, generators, and other consumers support that version, and validate the resulting document with a validator that respects the declared version. If you need to remain compatible with OpenAPI 3.1 consumers, keep the declaration and field usage within OpenAPI 3.1.

## Whole-query parameters (OpenAPI 3.2)

An `in: querystring` parameter describes the entire query string. Its `name` is documentary and is not added to the request URL. Scalar uses the parameter's `content` media type to serialize its value.

For content other than `application/x-www-form-urlencoded`, Scalar percent-encodes the serialized value, including JSON delimiters. For example, a JSON value of `{"limit":2}` produces `?%7B%22limit%22%3A2%7D` in both requests and generated code samples.

To supply URI-ready content with its encoding preserved, set `serializedValue` in an example on the **parameter itself**:

```yaml
parameters:
  - name: search
    in: querystring
    required: true
    content:
      application/json:
        schema:
          type: object
          properties:
            limit:
              type: integer
    examples:
      default:
        serializedValue: '%7B%22limit%22%3A2%7D'
```

A `serializedValue` under a media type describes serialized media content and still undergoes URI encoding. The parameter-level example bypasses that step; provide any escaping required by the target server and HTTP client yourself.

OpenAPI 3.2 does not allow mixing `in: querystring` and named `in: query` parameters. For existing descriptions containing both, Scalar preserves the values and emits the whole-query content first, followed by named query parameters and query authentication parameters. Duplicate keys are preserved: a whole-query `status=available` and a named `status=sold` produce `?status=available&status=sold`. Scalar does not choose which value wins; that depends on the receiving server. The editor explains why additional named parameters cannot be added while keeping existing rows editable.

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

### Link code samples to request examples

Set `example` to a key in `requestBody.content[contentType].examples` and set `contentType` to that media type. Samples with the same `lang` and `label` share one language option. The example switcher chooses the matching sample without changing the selected language.

```yaml
openapi: 3.1.0
info: { title: Widgets API, version: '1.0' }
paths:
  /widgets:
    post:
      requestBody:
        content:
          application/json:
            schema: { type: object }
            examples:
              simple: { value: { name: Basic } }
              detailed: { value: { name: Premium, description: More features } }
      responses:
        '200': { description: Created }
      x-codeSamples:
        - lang: Python
          example: simple
          contentType: application/json
          source: client.widgets.create(name="Basic")
        - lang: Python
          example: detailed
          contentType: application/json
          source: client.widgets.create(name="Premium", description="More features")
```

The same fields work with `x-scalar-examples`, `x-code-samples`, and `x-custom-examples`. Omit `contentType` to use a sample for any media type with that example key. The `contentType` must exactly match the request body media type key, including any parameters: `application/json; charset=utf-8` does not match `application/json`. Static samples without `example` keep their own language-menu entries. Their source stays unchanged when switching body examples, but the switcher still controls which example opens in Test Request. If a linked sample is missing for the selected example, Scalar displays an unavailable message.

### Code samples from other tools

If your OpenAPI document is generated by another tool, we also read code samples from the extensions those tools write. When more than one of these is present on an operation, we use the highest-priority source only (instead of showing duplicates from every tool). Priority, highest first:

1. `x-scalar-examples`
2. `x-stainless-snippets` (overrides `x-stainless-examples`)
3. `x-stainless-examples`
4. `x-readme` (via `x-readme.code-samples`)
5. `x-codeSamples` / `x-code-samples` / `x-custom-examples`

`x-scalar-examples` uses the same shape as `x-codeSamples` (a list of `lang` / `label` / `source` entries):

```yaml
paths:
  '/accounts':
    get:
      x-scalar-examples:
        - lang: python
          label: List accounts
          source: client.accounts.list()
```

`x-stainless-examples` is an example (or array of examples) with an optional `title` and a `request` map of source code keyed by language. The `title` is used as the label in the picker.

```yaml
paths:
  '/accounts':
    get:
      x-stainless-examples:
        title: List active accounts
        request:
          python: client.accounts.list(status="active")
          node: await client.accounts.list({ status: 'active' });
```

`x-stainless-snippets` is a map of source code keyed by language:

```yaml
paths:
  '/accounts':
    get:
      x-stainless-snippets:
        python: client.accounts.list()
        node: await client.accounts.list();
```

`x-readme.code-samples` is a list of samples using ReadMe's field names (`language`, `code`, `name`). ReadMe's `correspondingExample` refers to a response example, so it is not used to link samples to request body examples:

```yaml
paths:
  '/accounts':
    get:
      x-readme:
        code-samples:
          - language: curl
            name: Custom cURL
            code: curl https://api.example.com/accounts
```

## x-example / x-examples

For Swagger 2.0 documents, we support `x-example` and `x-examples` extensions on body parameters. These bring OpenAPI 3.x example functionality to older specifications.

Use `x-example` for a single example value:

```yaml
swagger: '2.0'
paths:
  '/planets':
    post:
      consumes:
        - application/json
      parameters:
        - in: body
          name: body
          schema:
            type: object
          x-example:
            application/json:
              name: Earth
```

Use `x-examples` for multiple named examples with summaries:

```yaml
swagger: '2.0'
paths:
  '/planets':
    post:
      consumes:
        - application/json
      parameters:
        - in: body
          name: body
          schema:
            type: object
          x-examples:
            application/json:
              earth-example:
                summary: Earth planet
                value:
                  name: Earth
              mars-example:
                summary: Mars planet
                value:
                  name: Mars
```

## externalValue

`externalValue` is a standard OpenAPI field on an [Example Object](https://spec.openapis.org/oas/v3.1.0#example-object). It lets you keep large request or response examples outside of your OpenAPI document and point to them by URL instead. This is useful when a single document would otherwise contain hundreds or thousands of big example payloads.

Scalar fetches an external example only when its selected preview becomes visible or you open it in Test Request. Other examples, including examples on hidden operations, are not downloaded during document loading. The request preview, generated code snippets, and Test Request use the same resolved payload.

Successful downloads are cached for the loaded document. Selecting an example again reuses its payload; replacing the document clears the cache. While an example loads, Scalar shows a loading message. If the download fails, you can retry. Sending the request is disabled until its selected example is ready.

```yaml
paths:
  '/shipments':
    post:
      requestBody:
        content:
          application/json:
            examples:
              shipper-standard:
                summary: Shipper Standard
                externalValue: /examples/post-shipment/shipper-standard.json
```

The referenced endpoint returns the raw example payload:

```json
{
  "shippingType": "Shipper_001",
  "packages": []
}
```

A few things to keep in mind:

- `value` and `externalValue` are mutually exclusive. If both are present, `value` is used.
- Relative URLs (like the one above) are resolved against the URL your document was loaded from.
- The referenced URL must be reachable by the browser (CORS applies), and should return JSON or YAML.

## Nested tags (OpenAPI 3.2)

In OpenAPI 3.2, you can nest tags with the native `parent` field instead of `x-tagGroups`. Set `parent` to the `name` of another tag declared in the document. Tags can be nested across multiple levels, and a parent tag can have operations of its own alongside its child tags.

Use `summary` for a readable tag title in the navigation and section headings. Operations still reference the tag's `name`. If `x-displayName` is also set, it takes precedence over `summary`.

```yaml
openapi: 3.2.0
info:
  title: Example
  version: '1.0.0'
tags:
  - name: galaxy
    summary: Galaxy
  - name: planets
    summary: Planets
    parent: galaxy
  - name: moons
    summary: Moons
    parent: planets
paths:
  /planets:
    get:
      summary: Get all planets
      tags:
        - planets
      responses:
        '200':
          description: A list of planets
  /moons:
    get:
      summary: Get all moons
      tags:
        - moons
      responses:
        '200':
          description: A list of moons
```

This creates the hierarchy **Galaxy → Planets → Moons**. The Planets section contains both its own operation and the nested Moons section.

When at least one `parent` relationship points to a declared tag without forming a cycle, Scalar uses native nesting for the document instead of `x-tagGroups`. Unknown parents, self-references, and circular relationships do not create nesting. If no valid nesting relationship remains, Scalar falls back to `x-tagGroups`.

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

You can group your tags with `x-tagGroups`. This remains supported for existing API descriptions and OpenAPI versions before 3.2. For OpenAPI 3.2, use [native nested tags](#nested-tags-openapi-32) with `parent` instead.

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

You can also hide authentication. Add `x-scalar-ignore` to a whole security scheme to drop it from the auth selector, or to a single OAuth2 flow to hide just that flow's tab. This is handy for flows that cannot run in the browser, like Client Credentials, which usually fails on CORS:

```yaml
components:
  securitySchemes:
    oauth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.example.com/authorize
          tokenUrl: https://auth.example.com/token
          scopes: {}
        clientCredentials:
          tokenUrl: https://auth.example.com/token
          scopes: {}
          x-scalar-ignore: true
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

## x-order

You can control the display order of schema properties with `x-order`. Properties with `x-order` are sorted by their numeric value (ascending) and displayed before properties without `x-order`.

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
components:
  schemas:
    Planet:
      type: object
      properties:
        name:
          type: string
+          x-order: 1
        description:
          type: string
+          x-order: 3
        diameter:
          type: number
+          x-order: 2
```

In this example, properties will be displayed in the order: `name`, `diameter`, `description`.

`x-order` also controls the order of OAuth2 flow tabs in the auth section. Flows with a lower `x-order` appear first, and the first tab is selected by default — so giving a flow the lowest `x-order` both moves it to the front and makes it the default:

```yaml
components:
  securitySchemes:
    oauth2:
      type: oauth2
      flows:
        implicit:
          authorizationUrl: https://auth.example.com/authorize
          scopes: {}
          x-order: 2
        authorizationCode:
          authorizationUrl: https://auth.example.com/authorize
          tokenUrl: https://auth.example.com/token
          scopes: {}
          x-order: 1
```

Here the `authorizationCode` tab appears first and is selected by default.

## x-scalar-stability

You can show the stability of an endpoint by setting the `x-scalar-stability` to either `stable`, `experimental` or `deprecated`. The native `deprecated` property will take precedence.

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

You can add descriptions to `enum` values with `x-enum-descriptions`:

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

We generate custom code examples for all languages, but you might have a custom SDK for your API. Provide installation instructions in the header and they replace the generic HTTP clients in the introduction.

Each entry has a `lang` (used as the tab label and to pick a matching language icon) and a `description`. The `description` supports Markdown, including fenced code blocks with syntax highlighting, so a single tab can show multiple snippets (for example Maven and Gradle for Java).

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
+  x-scalar-sdk-installation:
+  - lang: TypeScript
+    description: |-
+      Install our **Custom SDK** from npm:
+
+      ```sh
+      npm install @your-awesome-company/sdk
+      ```
+  - lang: Java
+    description: |-
+      Add the dependency with Maven:
+
+      ```xml
+      <dependency>
+        <groupId>com.your-awesome-company</groupId>
+        <artifactId>sdk</artifactId>
+        <version>1.0.0</version>
+      </dependency>
+      ```
+
+      …or with Gradle:
+
+      ```groovy
+      implementation 'com.your-awesome-company:sdk:1.0.0'
+      ```
```

| Option      | Type   | Description                                                                                        |
| ----------- | ------ | ------------------------------------------------------------------------------------------------- |
| lang        | string | **REQUIRED**. The language or platform of the SDK (for example `TypeScript`, `Java`, `Python`).   |
| description | string | The installation instructions for this language. Supports Markdown, including fenced code blocks. |

## x-scalar-links

Add named links next to the contact, license and terms of service links in the introduction. This is handy for the legal texts that some countries require on public websites, like a privacy policy or an imprint.

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
+  x-scalar-links:
+  - name: Privacy Policy
+    url: https://example.com/privacy
+  - name: Imprint
+    url: https://example.com/imprint
```

| Option | Type   | Description                                       |
| ------ | ------ | ------------------------------------------------- |
| name   | string | **REQUIRED**. The label to display for the link.  |
| url    | string | **REQUIRED**. The URL the link points to.         |

## x-pre-request

Add pre-request scripts to operations or at the document level. Scripts run before the request is sent and can modify headers, set variables, or prepare authentication. See [Scripts in the API Client](./guides/app/scripts.md) for the full guide.

On an operation:

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
paths:
  '/users':
    get:
      summary: Get all users
+      x-pre-request: |-
+        pm.environment.set('timestamp', new Date().toISOString())
```

On the document (runs before every operation):

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
+x-pre-request: |-
+  pm.request.headers.add({
+    key: 'X-Request-Id',
+    value: 'req-' + Date.now()
+  })
```

When both document-level and operation-level scripts are present, the document-level script runs first.

## x-post-response

Add post-response scripts to operations to automatically validate API responses. Scripts use a Postman-compatible syntax and run after each request in the [API Client](./guides/app/testing.md).

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
paths:
  '/planets':
    get:
      summary: Get all planets
+      x-post-response: |-
+        pm.test("Status code is 200", () => {
+          pm.response.to.have.status(200)
+        })
```

You can add multiple assertions in a single script:

```diff
openapi: 3.1.0
info:
  title: Example
  version: 1.0
paths:
  '/planets':
    post:
      summary: Create a planet
+      x-post-response: |-
+        pm.test("Returns 201", () => {
+          pm.expect(pm.response.code).to.be.oneOf([201, 202])
+        })
+        pm.test("Response is valid JSON", () => {
+          const data = pm.response.json()
+          pm.expect(data).to.be.an('object')
+        })
```

See [Testing in the API Client](./guides/app/testing.md) for all available assertions and the full `pm` API reference.
