# OpenAPI Extensions

Scalar SDK Generator reads a small set of OpenAPI vendor extensions when it derives an SDK configuration and compiles an SDK. They let an API description carry SDK-specific intent without requiring a separate configuration file.

Use these extensions only where the guide says they are supported. Values from an OpenAPI document are treated as untrusted input: malformed values are ignored or reported through [Diagnostics](diagnostics.md), rather than becoming generated code.

Extensions that mirror a configuration block use the same field names and value shapes as [Configuration](configuration.md). A standalone Scalar SDK configuration remains the better home for settings shared across multiple documents or targets.

## Scalar extensions

### Document root

| Extension | Value | Effect |
| --- | --- | --- |
| `x-scalar-sdk-client-settings` | A `clientSettings` object | Supplies client-wide defaults such as headers, timeouts, retries, idempotency-header settings, and response headers. Credentials in `opts` are ignored; declare those with OpenAPI security schemes instead. |
| `x-scalar-sdk-settings` | A `settings` object | Supplies cross-target generation settings, including response-envelope fields, method ordering, positional parameters, and agent-skill generation. `fileHeader` is ignored. |
| `x-scalar-pagination` | An array of complete `pagination` schemes | Declares reusable paging schemes. Operations select one by name with their own `x-scalar-pagination`. |

```yaml
x-scalar-sdk-client-settings:
  defaultTimeout: 30000
  defaultRetries:
    maxRetries: 2
  defaultHeaders:
    X-Client: acme-sdk

x-scalar-sdk-settings:
  unwrapResponseFields: [data]
  ordering: crud

x-scalar-pagination:
  - name: cursor
    type: cursor
    request:
      cursor:
        type: cursor
        param: cursor
        location: query
    response:
      items:
        type: items
        location: body
        path: [data]
      next:
        type: cursor
        location: body
        path: [next_cursor]
```

### Operations

| Extension | Value | Effect |
| --- | --- | --- |
| `x-scalar-method` | Dotted `resource.method` name | Places an operation in a resource and names the generated method. A single segment is ignored; use `x-scalar-method-name` when only the name should change. |
| `x-scalar-method-name` | Method name | Names the generated method while retaining inferred resource placement. |
| `x-scalar-ignore` | `true` | Omits the operation from generated SDKs. The standard `x-internal: true` marker has the same effect for operations. |
| `x-scalar-deprecation-message` | String, or `{ default }` | Marks the method deprecated and supplies its deprecation message. |
| `x-scalar-retries` | Non-negative integer | Sets the operation's retry count. |
| `x-scalar-streaming` | `sse` or `jsonl` | Declares server-sent events or newline-delimited JSON streaming. |
| `x-scalar-pagination` | Scheme name, `false`, or an inline scheme | Enables paging with a root-declared scheme, explicitly disables it, or declares a one-operation scheme. |
| `x-scalar-unwrap` | Response property name or `false` | Returns a property from a response envelope, or opts that operation out of global unwrapping. This extension is operation-only; use `x-scalar-sdk-settings.unwrapResponseFields` for the SDK-wide rule. |

```yaml
paths:
  /users:
    get:
      operationId: listUsers
      x-scalar-method: users.list
      x-scalar-pagination: cursor
      x-scalar-unwrap: data
      responses:
        '200': { description: OK }
```

### Parameters

| Extension | Placement | Effect |
| --- | --- | --- |
| `x-scalar-parameter-name` | Parameter Object | Uses this spelling for the SDK parameter. |
| `x-scalar-useDefault` | Parameter Object | Makes the parameter required in the generated SDK even when OpenAPI marks it optional. |
| `x-scalar-allow-reserved` | Parameter Object | Preserves reserved characters when serializing the parameter. |

### Schemas and properties

| Extension | Placement | Effect |
| --- | --- | --- |
| `x-scalar-name` | Schema | Names a generated type or an inline schema promoted to a type. |
| `x-scalar-model` | Component schema | Marks a schema as a surfaced model and can provide its resource-qualified model name. |
| `x-scalar-property-name` | Property schema | Uses this spelling for the generated property. |
| `x-scalar-ignore` | Component schema or property schema | Omits the component or property from the SDK. |
| `x-scalar-unknown` | Schema | Lowers the schema to the target's unknown/untyped value. |
| `x-scalar-override-schema` | Schema | Replaces the schema used for SDK type lowering. |
| `x-scalar-empty-object` | Schema | Treats a property-less object as a deliberate named empty type, rather than an untyped map. |
| `x-scalar-nominal` | Enum schema | Keeps a named enum type instead of collapsing it to a structural union where the target supports that distinction. |
| `x-scalar-variant-name` | Inline union arm | Names an inline `oneOf` or `anyOf` variant. |
| `x-scalar-deprecation-message` | Schema or property schema | Supplies the generated deprecation message. |
| `x-scalar-docs` | Schema or response header | Carries documentation metadata into the SDK IR. |
| `x-scalar-example` | Schema | Gives generated SDK samples a preferred value. It takes precedence over a synthesized placeholder. |

`x-scalar-override-schema` takes a Schema Object as its value. This is useful when the published description must retain a broader wire shape while the SDK intentionally exposes a safer or more specific type.

### Enums

The following arrays are aligned with the enum's `enum` values by index. Values that cannot be aligned are ignored.

| Extension | Value | Effect |
| --- | --- | --- |
| `x-scalar-enum-names` | Array of strings | SDK member names where the target emits named enum members. |
| `x-scalar-enum-descriptions` | Array | Per-member documentation. |
| `x-scalar-enum-deprecations` | Array | Per-member deprecation metadata. |
| `x-scalar-enum-format` | `union` | Requests a union-style enum where supported. |

### Generated OpenAPI additions

These extensions are written to an augmented OpenAPI document by the generator. They may also be preserved when already present in a source document.

| Extension | Placement | Effect |
| --- | --- | --- |
| `x-scalar-sdk-installation` | `info` | Installation instructions for generated SDK targets. |
| `x-scalar-examples` | Operation | An alternative code-sample key with the same `{ lang, source }` entry shape as `x-codeSamples`. |

The code-sample pipeline also recognizes `x-codeSamples`, `x-code-samples`, and `x-custom-examples` on operations. Select the output key with `openapi.codeSamples` in the SDK configuration.

## Imported vendor extensions

The following are compatibility readers. They are useful when importing an existing Fern, Speakeasy, or Stainless project; new documents should generally use the native Scalar extension or configuration field named in the table.

### Fern

| Extension | Supported placement | Scalar behavior |
| --- | --- | --- |
| `x-fern-sdk-group-name` | Operation | Resource placement; a string or array creates nested resources. |
| `x-fern-sdk-method-name` | Operation | Generated method name. |
| `x-fern-ignore` | Operation, component, property, or parameter | Omits that node. |
| `x-fern-pagination` | Operation | Pagination scheme and binding. |
| `x-fern-availability` | Operation, schema, or property | `deprecated` becomes generated deprecation metadata; other availability stages are not mapped. |
| `x-fern-streaming` | Operation | `sse` or JSON-lines streaming. |
| `x-fern-retries` | Operation | Retry count; Fern's `max-attempts` is converted to Scalar retries. |
| `x-fern-audiences` | Operations, schemas, properties, and servers | Filters the imported SDK to the audiences selected by the Fern generator configuration. |
| `x-fern-global-headers` | Document root | Default headers or client constructor options. |
| `x-fern-global-parameters` | Document root | Client constructor options and their request locations. Header parameters are sent end to end; other locations are retained as configuration but are not yet emitted by every target. |
| `x-fern-idempotency-headers` | Document root | Client idempotency-header setting; the first declared header wins. |
| `x-fern-idempotent` | Operation | Participates in idempotency compatibility checks; per-operation intent cannot always be represented by Scalar's client-wide setting. |
| `x-fern-base-path` | Document root | Appended to imported environment URLs. |
| `x-fern-server-name` | Server | Imported environment name. |
| `x-fern-default-url` | Server | Imported environment URL, replacing a templated server URL. |
| `x-fern-version` | Document root | Client option sent as the version header; Fern's allowed-values list is not retained. |
| `x-fern-sdk-variables` | Document root | Declares SDK variables. |
| `x-fern-sdk-variable` | Parameter | Binds a parameter to an SDK variable. |
| `x-fern-webhook` | Operation | Prevents an inbound webhook operation from becoming an outbound client call. |
| `x-fern-webhook-signature` | Document root or webhook | Webhook signature-verification settings where Scalar has an equivalent. |
| `x-fern-type-name` | Schema | Generated type name. |
| `x-fern-property-name` | Property schema | Generated property name. |
| `x-fern-parameter-name` | Parameter Object | Generated parameter name. |
| `x-fern-enum` | Enum schema | Per-member name, description, and deprecation. Its per-target `casing` field is not mapped. |
| `x-fern-default` | Parameter Object | The default value sent when the SDK caller omits the parameter. |
| `x-fern-examples` | Any | Not used for generated SDK samples; its shape differs from Scalar's code-sample extensions. |

### Speakeasy

| Extension | Supported placement | Scalar behavior |
| --- | --- | --- |
| `x-speakeasy-name-override` | Operation, including a global parameter | Operation method name or global client-option name. The root regex-rule form is deliberately not evaluated. |
| `x-speakeasy-globals` | Document root | Hoists listed parameters to client constructor options. Header globals are emitted; query, path, and body locations are retained as configuration but are not yet sent by every target. |
| `x-speakeasy-pagination` | Operation | Selects the imported pagination scheme. |
| `x-speakeasy-retries` | Document root | Imports SDK-wide retry settings. |

### Stainless

| Extension | Supported placement | Scalar behavior |
| --- | --- | --- |
| `x-stainless-pagination-property` | Parameter or response-field schema | Infers pagination type and field roles. |
| `x-stainless-skip` | Parameter or property schema | Omits the node. |
| `x-stainless-empty-object` | Schema | Same behavior as `x-scalar-empty-object`. |
| `x-stainless-param` | Parameter schema | Canonical SDK parameter name, re-cased for each target. |
| `x-stainless-naming` | Object, enum, or parameter schema | Per-target `property_name` and `type_name` overrides. `node` is the TypeScript target alias. |
| `x-stainless-renameMap` | Enum schema | SDK member names, using `{ sdkName: wireValue }`. |

## Extensions outside the SDK vocabulary

`x-scalar-navigation`, `x-scalar-order`, `x-scalar-is-dirty`, `x-scalar-original-document-hash`, `x-scalar-original-source-url`, and `x-scalar-registry-meta` are Scalar workspace metadata. The loader strips them before generation; do not use them to control an SDK.

`x-displayName` and `x-tagGroups` are preserved or synthesized only when generating an augmented OpenAPI document with `openapi.tags: "resources"`; they do not alter generated SDK methods or models.

## Next steps

- [Configuration](configuration.md) — the config blocks mirrored by root-level extensions
- [Pagination](pagination.md) — the scheme shape `x-scalar-pagination` carries, and the helpers it generates
- [Diagnostics](diagnostics.md) — messages for invalid, ignored, or incomplete input
- [AsyncAPI](asyncapi.md) — SDK generation from AsyncAPI documents
