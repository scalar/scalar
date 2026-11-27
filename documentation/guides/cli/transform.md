# Transform API Descriptions

Generate public, private, staging, and production variants from one API description with `scalar document transform`. Filter internal operations, change server URLs, and edit documentation metadata without changing the source file.

Transform accepts local files and URLs containing JSON or YAML OpenAPI 2.0, OpenAPI 3.0–3.2, or AsyncAPI 2.x/3.x descriptions. It preserves the OpenAPI or AsyncAPI version. Choose JSON or YAML serialization with the output filename.

## Quick start

Create a transformation configuration, then pass it alongside your source and an explicit output path:

```bash
scalar document transform api.yaml --config public-production.yaml --output public-api.yaml
```

Both `--config` and `--output` are required. Configuration is a JSON or YAML file containing ordered steps; it is not executable code. See [Getting Started](getting-started.md#installation) to install the Scalar CLI.

## Generate public production and private staging variants

This example starts with one API description containing a public endpoint, an internal endpoint, and internal metadata. The public production output removes internal content. The private staging output keeps it and uses a staging server.

### Source: `api.yaml`

Mark an operation with `x-internal: true` to make it eligible for filtering. You can also mark an entire path or channel as internal.

```yaml
openapi: 3.1.0
info:
  title: Pet Platform API
  version: 1.0.0
  x-internal-notes: Contact the platform team for admin access.
servers:
  - url: http://localhost:3000
paths:
  /pets:
    get:
      operationId: listPets
      responses:
        '200':
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
  /admin/status:
    get:
      operationId: getAdminStatus
      x-internal: true
      responses:
        '200':
          description: Internal service status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AdminStatus'
components:
  schemas:
    Pet:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
    AdminStatus:
      type: object
      properties:
        queueDepth:
          type: integer
```

### Public production configuration: `public-production.yaml`

Remove internal operations and explicitly delete the internal notes. Then replace the root server list and title. `removeUnusedComponents: true` removes the `AdminStatus` schema once no remaining operation references it.

```yaml
version: 1
steps:
  - type: remove-internal-operations
  - type: remove
    pointer: /info/x-internal-notes
  - type: set
    pointer: /servers
    value:
      - url: https://api.example.com
  - type: set
    pointer: /info/title
    value: Public Pet API
removeUnusedComponents: true
```

### Private staging configuration: `private-staging.yaml`

Omit `remove-internal-operations` to keep both endpoints. This configuration also keeps the internal notes and changes the root server list and title.

```yaml
version: 1
steps:
  - type: set
    pointer: /servers
    value:
      - url: https://staging-api.example.com
  - type: set
    pointer: /info/title
    value: Internal Pet API - Staging
removeUnusedComponents: true
```

### Generate both outputs

Run both commands from the directory containing the source and configuration files:

```bash
scalar document transform api.yaml \
  --config public-production.yaml \
  --output public-api.yaml

scalar document transform api.yaml \
  --config private-staging.yaml \
  --output private-api.yaml
```

### Public production output: `public-api.yaml`

The output contains only `/pets` and its `Pet` schema. The admin operation, `AdminStatus` schema, and internal notes are removed.

```yaml
openapi: 3.1.0
info:
  title: Public Pet API
  version: 1.0.0
servers:
  - url: https://api.example.com
paths:
  /pets:
    get:
      operationId: listPets
      responses:
        "200":
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Pet"
components:
  schemas:
    Pet:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
```

### Private staging output: `private-api.yaml`

The output keeps both endpoints, both schemas, and the internal notes. The server points to staging. The original `api.yaml` remains unchanged after both commands.

```yaml
openapi: 3.1.0
info:
  title: Internal Pet API - Staging
  version: 1.0.0
  x-internal-notes: Contact the platform team for admin access.
servers:
  - url: https://staging-api.example.com
paths:
  /pets:
    get:
      operationId: listPets
      responses:
        "200":
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Pet"
  /admin/status:
    get:
      operationId: getAdminStatus
      x-internal: true
      responses:
        "200":
          description: Internal service status
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AdminStatus"
components:
  schemas:
    Pet:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
    AdminStatus:
      type: object
      properties:
        queueDepth:
          type: integer
```

## Transformation configuration

`version` must be `1`. `steps` is an array applied in the order listed. `removeUnusedComponents` defaults to `false`.

| Step | Behavior |
| --- | --- |
| `remove-internal-operations` | Remove operations marked `x-internal: true`, including operations under internal paths or channels. |
| `set` | Add or replace the value at `pointer` with `value`. |
| `remove` | Delete the existing value at `pointer`. |

### Remove internal operations

For OpenAPI 3.x, filtering covers paths, webhooks, callbacks, and reusable `components/pathItems`, including when component pruning is disabled. For OpenAPI 2.0, it covers paths. For AsyncAPI 2.x, it covers channel `publish` and `subscribe` operations; for AsyncAPI 3.x, it covers operations and internal channels. Matching no internal operations is a successful no-op.

Filtering internal operations does not remove every form of confidential content. Explicitly remove private metadata, descriptions, and examples, as the example does for `/info/x-internal-notes`.

### Edit values with JSON Pointers

A pointer identifies an exact location. Escape `/` inside a key as `~1`, and `~` as `~0`. For example, the server list of the `/pets` path is `/paths/~1pets/servers`.

`set` replaces an entire value; it does not merge objects or append to arrays. The parent must already exist, and array indices must already exist. `remove` must match an existing target. Replacing the document root and using prototype-related pointer segments are rejected.

### Remove unused components

Set `removeUnusedComponents: true` to prune reusable content after all steps run. Pruning follows references, security scheme requirements, and discriminator mappings, and preserves reachable cycles. AsyncAPI 3.x channels are retained through their operations.

With the default `false`, unused schemas and other reusable content remain in the output. Internal operations in OpenAPI `components/pathItems` are still filtered.

## Configure servers for other formats

The example replaces the root OpenAPI 3.x `/servers` array. Other document formats use different fields:

| Format | Configuration |
| --- | --- |
| OpenAPI 2.0 | Use `set` steps for `/host`, `/basePath`, and `/schemes`, such as `staging.example.com`, `/v1`, and `[https]`. |
| AsyncAPI 2.x | Set `/servers` to a map, such as `{staging: {url: staging.example.com, protocol: amqp}}`. |
| AsyncAPI 3.x | Set `/servers` to a map, such as `{staging: {host: staging.example.com, protocol: amqp}}`. |

Replacing the root server configuration leaves path-, operation-, and channel-level overrides in place. Edit those explicitly if they also need to change. AsyncAPI 2.x channel server-name lists must name entries in the replacement map; AsyncAPI 3.x channel server references must still resolve.

## Output and failure behavior

Use an output filename ending in `.json`, `.yaml`, or `.yml`. Parent directories must already exist. Input, configuration, and referenced source files cannot be overwritten, including through symbolic links or hard links. Distinct existing output files must be writable.

Use `--output -` to print the transformed document to stdout in the source's JSON or YAML serialization. Diagnostics go to stderr, so stdout stays parseable:

```bash
scalar document transform api.yaml --config public-production.yaml --output -
```

The command loads and checks source references, bundles external references, applies ordered steps to a copy, optionally prunes components, validates references and the resulting description, then serializes and writes the output.

Invalid configurations, missing pointer targets, unresolved references, or invalid final descriptions fail with a nonzero exit status before replacing the destination. Source references must resolve even if a later step would remove the content that references them. There is no incomplete-output mode.

Regular output files are replaced atomically, preserving ownership and permissions. If ownership transfer is denied for a shared writable file, it is updated in place to preserve ownership; that fallback is not atomic. Source formatting and YAML comments are not preserved.

For reproducible outputs, keep the source, configuration, referenced content, and CLI version fixed. Pin remote content when using URLs. This configuration is specific to the transform command; it is not an OpenAPI Overlay or a plugin API.
