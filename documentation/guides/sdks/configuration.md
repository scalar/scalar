# Configuration

Scalar SDK generation is driven by a single config object that describes the SDK name, version, target outputs, environments, resource tree, client settings, pagination, serialization, and publishing behavior.

Use the config to keep SDK behavior predictable across generated targets. The top-level `targets` map controls which artifacts are generated, while `resources` controls the public client shape.

## Minimal config

```json
{
  "name": "Acme API",
  "version": "1.0.0",
  "environments": {
    "production": "https://api.acme.com"
  },
  "environmentOrder": ["production"],
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
  "resources": {}
}
```

## Required properties

| Property           | Description                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `name`             | Human-readable SDK or product name used for generated metadata and clients. |
| `version`          | Base SDK version. Target-level versions can override this value.            |
| `resources`        | Resource tree that defines the generated client and resource shape.         |
| `targets`          | Per-language packaging, publishing, and emitter options.                    |
| `environments`     | Named base URLs the generated client can switch between.                    |
| `environmentOrder` | Environment insertion order. The first entry is the default environment.    |

## Targets

Add a key under `targets` for every artifact you want Scalar to generate.

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

Supported target keys are `typescript`, `python`, `cli`, `go`, `rust`, `java`, `kotlin`, `swift`, `ruby`, `php`, `csharp`, `cpp`, `dart`, and `terraform`.

Set `skip: true` on a target to keep its config in place without generating it.

## Resources

The `resources` object defines the public client tree. Each resource can contain generated methods, public models, nested resources, default request options, and per-target visibility rules.

```json
{
  "resources": {
    "users": {
      "methods": {
        "list": "get /users",
        "create": {
          "kind": "http",
          "endpoint": "post /users",
          "verb": "post",
          "path": "/users",
          "defaultRequestOptions": {
            "headers": {}
          }
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

Use `skip` to omit a method, model, or resource globally or for specific targets. Use `only` to restrict it to a list of targets.

## Client Settings

Use `clientSettings` for constructor options, authentication values, default headers, environment variable names, timeouts, retries, and response headers surfaced by generated SDKs.

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

## Environments

`environments` maps names to base URLs. `environmentOrder` controls the generated order and default.

```json
{
  "environments": {
    "production": "https://api.acme.com",
    "sandbox": "https://sandbox.acme.com"
  },
  "environmentOrder": ["production", "sandbox"]
}
```

## Pagination

Define reusable pagination schemes in `pagination`, then reference them from methods with `paginated`.

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
          "path": ["data"]
        },
        "next": {
          "type": "cursor",
          "location": "body",
          "path": ["next_cursor"]
        }
      }
    }
  ]
}
```

Supported pagination types are `cursor`, `cursorId`, `cursorUrl`, `offset`, and `pageNumber`.

## Serialization

Use `querySettings` and `multipartSettings` to control how generated request builders serialize arrays and nested objects.

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

Supported array formats are `comma`, `repeat`, `indices`, and `brackets`. Supported nested query formats are `brackets` and `dots`.

## OpenAPI Overrides

Use `openapi` for SDK-specific overrides that sit next to the source API description.

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

## Other Options

| Property            | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `customCasings`     | Override symbol casing and configure initialisms.                           |
| `ignoredEndpoints`  | Drop endpoints from generation using `"<verb> <path>"`, such as `get /me`.  |
| `errors`            | Configure how generated runtimes read error response messages.              |
| `streaming`         | Configure global streaming event handling hints for generated SDKs.         |
| `settings`          | Cross-target generator behavior, such as file headers and response unwraps. |
| `multipartSettings` | Multipart/form-data serialization preferences.                              |

