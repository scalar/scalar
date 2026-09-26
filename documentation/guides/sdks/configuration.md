<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand — run:
bun run --filter @scalar/sdk-config types:generate

Published at https://scalar.com/docs/guides/sdks/configuration, which is where the links to
pages outside this reference resolve.
-->
# Configuration

Scalar SDK generation is driven by a single config object: which languages to generate, the resource tree the clients expose, the environments they can reach, and how each package is named, versioned, and published.

The top-level `targets` map controls which artifacts are generated, while `resources` controls the public client shape.

For SDK behavior embedded in an OpenAPI document instead, see [OpenAPI Extensions](openapi-extensions.md). Root-level Scalar extensions mirror the configuration blocks below, while operation and schema extensions refine individual generated methods and types.

## Minimal config

Every property the schema requires, with a real value apiece. `$schema` is the one addition: it is not required, and an editor that reads it validates the file and completes its keys as you type.

```json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/sdk-config",
  "organization": {
    "name": "Acme API"
  },
  "environments": {
    "production": "https://api.acme.com"
  },
  "environmentOrder": [
    "production"
  ],
  "targets": {
    "typescript": {
      "packageName": "@acme/api"
    },
    "python": {
      "packageName": "acme_api",
      "projectName": "acme-api"
    },
    "cli": {
      "binaryName": "acme"
    }
  },
  "resources": {
    "users": {
      "methods": {
        "list": "get /users",
        "create": "post /users"
      },
      "models": {
        "User": "User"
      }
    }
  }
}
```

## Properties

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `organization` | `object` | ✅ | Identity of the organization publishing the SDKs. Its `name` also names the SDK and its generated client. |
| `resources` | `object` | ✅ | Resource tree that drives generated client/resource shape when present. |
| `targets` | `object` | ✅ | Per-language packaging, publishing, and emitter options keyed by target id. |
| `environments` | `object` | ✅ | Named base URLs the generated client can switch between. |
| `environmentOrder` | `string[]` | ✅ | Insertion order of environments; the first entry is the SDK default. |
| `generatorVersion` | `string` |  | Version of the Scalar SDK Generator used to generate the SDKs. Pins the generator release so regeneration is reproducible; omit to use the latest available generator. Target-level generatorVersion can override this for a specific target. |
| `readme` | `object` |  | Generated README content: its heading, whether it credits the generator, and the example requests its sections render. |
| `customCasings` | `object` |  | SDK symbol casing overrides, including configured initialisms. A key may span several words when written with separators (`three_ds`, not `threeDS`), which matches that word sequence wherever it appears in a generated name; a multi-word key needs at least one explicit `pascal`/`camel` spelling, since `initialism` applies to a single word; whichever form it declares spells both PascalCase and camelCase output. PascalCase and camelCase output honor a multi-word key, snake_case output already spells the key itself. |
| `clientSettings` | `object` |  | SDK-wide client constructor settings for auth, retries, timeouts, and headers. |
| `pagination` | `object[]` |  | Named pagination schemes referenced by method-level pagination settings. |
| `querySettings` | `object` |  | Query string serialization preferences shared by generated request builders. |
| `multipartSettings` | `object` |  | Multipart/form-data serialization preferences shared by generated request builders. |
| `settings` | `object` |  | Cross-target generator behavior that is not tied to a single emitter. |
| `openapi` | `object` |  | OpenAPI-adjacent config such as code samples and auth overrides. |
| `grpc` | `object` |  | How proto services are lowered into SDK surface: which protos are compiled, the wire protocol generated clients speak, per-service placement and naming, and RPCs to drop. `services`, `ignoredMethods` and `protocol` are read; `target` is for the proto loader. Under `transcode`, an RPC carrying no `google.api.http` annotation — or one the annotation cannot be honored for — falls back to a Connect call and is reported. |
| `errors` | `object` |  | Error response interpretation settings used by generated runtimes. |
| `ignoredEndpoints` | `string[]` |  | Endpoints to drop from generation entirely, even when a resource places them. Equivalent to `skip: true` on the placed method. Written as `"<verb> <path>"` for HTTP operations and `"grpc <package>.<Service>/<Method>"` for RPCs lowered from a proto. |
| `streaming` | `object` |  | Global streaming behavior and event handling hints. |
| `models` | `object` |  | Models not tied to a resource, keyed by component name. Used to carry settings (e.g. skipProperties) for component schemas that no resource lists. |
| `diagnostics` | `object` |  | Diagnostics gating, per-rule severity overrides, and suppressions. |

### organization

```json
{
  "organization": {
    "name": "Acme",
    "docs": "https://docs.acme.com",
    "contact": "sdk@acme.com",
    "securityContact": "security@acme.com"
  }
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | ✅ | Organization or company publishing the SDKs. Used as the author of generated packages and as the name the SDK and its client are derived from. |
| `docs` | `string` |  | URL of the API documentation site, linked from generated package metadata. |
| `contact` | `string` |  | Email address for SDK feedback, questions, and support requests, surfaced in generated package metadata. |
| `securityContact` | `string` |  | Email address API vulnerability reports should go to, named in the generated security policy. Every target emits one, and each routes reports against the generated SDK itself to Scalar instead, configured or not. |
| `logo` | `string` |  | Logo shown at the top of the page the generated CLI serves when a browser sign-in finishes: an `https` URL, or a `data:image/...` URI to keep the page from fetching anything. The page follows the viewer's light or dark mode, so use a logo that reads on both a white and a near-black background. Omit it and the page shows no logo, since generated SDKs carry no branding but the publisher's own. |

### resources

```json
{
  "resources": {
    "users": {
      "methods": {
        "list": "get /users",
        "create": {
          "kind": "http",
          "endpoint": "post /users"
        }
      },
      "models": {
        "User": "User"
      },
      "subresources": {
        "billing": {
          "methods": {
            "listInvoices": "get /users/{user_id}/invoices"
          }
        }
      }
    }
  }
}
```

Each resource can carry generated methods, public models, nested subresources, default request options, and per-target visibility rules.

Use `skip` to omit a method, model, or resource globally or for specific targets. Use `only` to restrict it to a list of targets.

### targets

```json
{
  "targets": {
    "typescript": {
      "packageName": "@acme/api",
      "packageManager": "pnpm",
      "destinations": {
        "production": {
          "repo": "acme/acme-typescript"
        }
      }
    },
    "python": {
      "packageName": "acme_api",
      "projectName": "acme-api"
    },
    "cli": {
      "binaryName": "acme",
      "defaultFormat": "json"
    }
  }
}
```

Supported target keys are [`typescript`](configuration/typescript.md), [`python`](configuration/python.md), [`go`](configuration/go.md), [`rust`](configuration/rust.md), [`java`](configuration/java.md), [`kotlin`](configuration/kotlin.md), [`swift`](configuration/swift.md), [`ruby`](configuration/ruby.md), [`php`](configuration/php.md), [`csharp`](configuration/csharp.md), [`cpp`](configuration/cpp.md), [`dart`](configuration/dart.md), and [`cli`](configuration/cli.md).

Set `skip: true` on a target to keep its config in place without generating it.

Set `promotion: "manual"` on a target to hold each build at staging until you promote it, instead of pushing to its production repository automatically. See [GitHub Repositories](publishing/github.md#promotion).

### environments

```json
{
  "environments": {
    "production": "https://api.acme.com",
    "sandbox": "https://sandbox.acme.com"
  },
  "environmentOrder": [
    "production",
    "sandbox"
  ]
}
```

`environments` maps a name to a base URL; `environmentOrder` fixes the order the generated client lists them in, and its first entry is the environment a client uses when none is chosen.

### clientSettings

```json
{
  "clientSettings": {
    "opts": {
      "apiKey": {
        "type": "string",
        "description": "API key for Acme.",
        "readEnv": "ACME_API_KEY",
        "securityScheme": "apiKey",
        "role": "value"
      }
    },
    "defaultHeaders": {
      "X-Acme-SDK": "true"
    },
    "defaultClientName": "Acme",
    "defaultEnvPrefix": "ACME",
    "defaultTimeout": 30000,
    "defaultRetries": {
      "maxRetries": 2,
      "initialDelaySeconds": 1,
      "maxDelaySeconds": 10
    }
  }
}
```

Client options can send values in headers, query parameters, body parameters, or path parameters. They can also map to OpenAPI security schemes or server variables.

### pagination

```json
{
  "pagination": [
    {
      "name": "cursor",
      "type": "cursor",
      "request": {
        "cursor": {
          "type": "cursor",
          "param": "cursor",
          "location": "query"
        }
      },
      "response": {
        "items": {
          "type": "items",
          "location": "body",
          "path": [
            "data"
          ]
        },
        "next": {
          "type": "cursor",
          "location": "body",
          "path": [
            "next_cursor"
          ]
        }
      }
    }
  ]
}
```

Schemes defined here are referenced from a method through its `paginated` setting; a scheme nothing references is reported as unused rather than silently ignored.

Supported pagination types are `cursor`, `cursorId`, `cursorUrl`, `fakePage`, `offset`, and `pageNumber`.

### querySettings

```json
{
  "querySettings": {
    "arrayFormat": "repeat",
    "nestedFormat": "brackets"
  },
  "multipartSettings": {
    "arrayFormat": "brackets"
  }
}
```

| Property | Type | Description |
| --- | --- | --- |
| `nestedFormat` | `"brackets" \| "dots"` | Object/nested query serialization strategy. |
| `arrayFormat` | `"comma" \| "repeat" \| "indices" \| "brackets"` | Array query serialization strategy. |

### multipartSettings

| Property | Type | Description |
| --- | --- | --- |
| `arrayFormat` | `"comma" \| "repeat" \| "indices" \| "brackets"` | Array serialization strategy for multipart/form-data fields. |

### openapi

```json
{
  "openapi": {
    "codeSampleLanguages": {
      "typescript": true,
      "python": true,
      "cli": true
    },
    "security": [
      {
        "apiKey": []
      }
    ],
    "securitySchemes": {
      "apiKey": {
        "type": "apiKey",
        "name": "X-API-Key",
        "in": "header"
      }
    },
    "operationSecurity": true
  }
}
```

These sit next to the source API document rather than in it: they add code samples, security schemes and auth overrides to the augmented OpenAPI the generator emits, without editing the document you maintain.

### diagnostics

```json
{
  "diagnostics": {
    "failOn": "error",
    "maxWarnings": 20,
    "rules": {
      "Endpoint/NotConfigured": "warn"
    }
  }
}
```

Every build analyzes your OpenAPI document and this configuration together and reports what generation had to skip, guess, or degrade. See [Diagnostics](diagnostics.md) for how the analysis works and the full list of rules.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `failOn` | `"off" \| "info" \| "warn" \| "error"` | `"error"` | Lowest severity that fails the build (default `error`); `off` disables severity gating. |
| `maxWarnings` | `number` |  | Maximum allowed warnings before the build fails. |
| `maxErrors` | `number` |  | Maximum allowed errors before the build fails. |
| `rules` | `object` |  | Per-rule severity override keyed by rule id (e.g. `Endpoint/NotConfigured`); `off` disables the rule. |
| `ignored` | `object` |  | Per-rule suppressions keyed by rule id. |

#### maxWarnings

**Constraints:** `minimum: 0`

#### maxErrors

**Constraints:** `minimum: 0`
