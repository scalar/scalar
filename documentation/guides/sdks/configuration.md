<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand.

Published at https://scalar.com/products/sdk-generator/configuration/overview, which is where the links to
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
    "name": "Acme"
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

| Property | Description |
| --- | --- |
| [`organization`](#organization)* | Identity of the organization publishing the SDKs. Its `name` also names the SDK and its generated client. |
| [`resources`](#resources)* | Resource tree that drives the generated client and resource shape. |
| [`targets`](#targets)* | Per-language packaging, publishing, and generation options, keyed by target id. |
| [`environments`](#environments)* | Named base URLs the generated client can switch between. |
| `environmentOrder`* | Order the generated client lists environments in; the first entry is the default. |
| `readme` | Generated README content: its heading, whether it credits the generator, and the example requests its sections render. |
| `customCasings` | SDK symbol casing overrides, including initialisms. A key may span several words when written with separators (`three_ds`, not `threeDS`), and then matches that word sequence anywhere in a generated name. A multi-word key needs an explicit `pascal` or `camel` spelling, since `initialism` applies to a single word; whichever one it declares spells both PascalCase and camelCase names. snake_case names already spell the key as written. |
| [`clientSettings`](#clientsettings) | SDK-wide client constructor settings for auth, retries, timeouts, and headers. |
| [`pagination`](#pagination) | Named pagination schemes referenced by method-level pagination settings. |
| [`querySettings`](#querysettings) | Query string serialization preferences shared by generated request builders. |
| [`multipartSettings`](#multipartsettings) | Multipart/form-data serialization preferences shared by generated request builders. |
| [`dateTimeSettings`](#datetimesettings) | Experimental: may change in a later release. How generated SDKs read `format: date-time` values out of responses. |
| `settings` | Generator behavior shared by every target. |
| [`openapi`](#openapi) | OpenAPI-adjacent config such as code samples and auth overrides. |
| `grpc` | How proto services become SDK methods: which protos are compiled, the wire protocol generated clients speak, per-service placement and naming, and RPCs to drop. Under `transcode`, an RPC with no usable `google.api.http` annotation falls back to a Connect call and is reported. |
| `errors` | Error response interpretation settings used by generated runtimes. |
| `ignoredEndpoints` | Endpoints to drop from generation entirely, even when a resource places them. Equivalent to `skip: true` on the placed method. Written as `"<verb> <path>"` for HTTP operations and `"grpc <package>.<Service>/<Method>"` for RPCs generated from a proto. |
| `streaming` | Global streaming behavior and event handling hints. |
| `models` | Models not tied to a resource, keyed by component name. Used to carry settings (e.g. skipProperties) for component schemas that no resource lists. |
| [`diagnostics`](#diagnostics) | When diagnostics fail the build, per-rule severity overrides, and suppressions. |

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

| Property | Description |
| --- | --- |
| `name`* | Organization or company publishing the SDKs. Used as the author of generated packages and as the name the SDK and its client are derived from. |
| `docs` | URL of the API documentation site, linked from generated package metadata and from the generated README. |
| `homepage` | URL of the publisher's or product's homepage, linked as the package homepage in every generated package manifest: `package.json` `homepage`, the `pyproject.toml` `Homepage` link, the gemspec `homepage`, Cargo `homepage`, Composer `homepage`, NuGet `PackageProjectUrl`, the Maven POM `url`, and the pubspec `homepage`. It is also the Homebrew formula's homepage when `publish.homebrew.homepage` is unset. When this is unset the package homepage falls back to `docs`, then to the target's source repository. `pyproject.toml` leaves that fallback out, since its Documentation and Source links already carry both, and so does the pubspec when it has a `repository` (without one, the docs site is its `homepage`, which `dart pub publish` expects). Only an absolute `http` or `https` URL is used; any other value is ignored. |
| `contact` | Email address for SDK feedback, questions, and support requests, surfaced in generated package metadata. Also where the generated security policy sends API vulnerability reports when `securityContact` is unset. |
| `securityContact` | Email address API vulnerability reports should go to, named in the generated security policy. When unset, the policy names `contact` instead. Every target generates one, and each sends reports about the generated SDK code itself to Scalar instead, whether or not this is set. |
| `logo` | Logo shown at the top of the page the generated CLI serves when a browser sign-in finishes: an `https` URL, or a `data:image/...` URI to keep the page from fetching anything. The page follows the viewer's light or dark mode, so use a logo that reads on both a white and a near-black background. Omit it and the page shows no logo, since generated SDKs carry no branding but the publisher's own. |

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

```json
{
  "resources": {
    "files": {
      "methods": {
        "create": "post /files",
        "upload": {
          "kind": "signedUpload",
          "endpoint": "post /files",
          "signedUpload": {
            "urlField": "upload_url",
            "headersField": "upload_headers",
            "confirm": {
              "endpoint": "post /files/{file_id}/complete",
              "pathParams": {
                "file_id": "id"
              }
            }
          }
        }
      }
    }
  }
}
```

```json
{
  "resources": {
    "widgets": {
      "methods": {
        "embed": "get /v1/embed/widget",
        "get_embed_url": {
          "kind": "signedUrl",
          "params": {
            "type": "object",
            "required": [
              "token"
            ],
            "properties": {
              "token": {
                "type": "string",
                "format": "uuid"
              },
              "css": {
                "type": "string"
              },
              "expiration": {
                "type": "string",
                "format": "date-time"
              },
              "target_origin": {
                "type": "string"
              }
            }
          },
          "signedUrl": {
            "source": {
              "sign": {
                "endpoint": "get /v1/embed/widget",
                "signature": {
                  "key": {
                    "clientOption": "api_key"
                  },
                  "signatureBase": [
                    "payload"
                  ],
                  "encoding": "base64",
                  "queryField": "hmac"
                },
                "query": {
                  "embed_request": {
                    "payload": "base64"
                  }
                },
                "defaults": {
                  "expiration": {
                    "now": "PT1M"
                  }
                }
              }
            },
            "action": "return"
          }
        },
        "get_embed_html": {
          "kind": "signedUrl",
          "returns": {
            "type": "string"
          },
          "signedUrl": {
            "source": {
              "method": "get_embed_url"
            },
            "action": {
              "fetch": {
                "accept": "text/html"
              }
            }
          }
        }
      }
    },
    "exports": {
      "methods": {
        "download": {
          "kind": "signedUrl",
          "returns": {
            "type": "string",
            "format": "binary"
          },
          "signedUrl": {
            "source": {
              "request": {
                "endpoint": "post /v1/exports/{export_id}/download",
                "urlField": "download_url"
              }
            },
            "action": {
              "fetch": {}
            }
          }
        }
      }
    },
    "images": {
      "methods": {
        "signed_image_url": {
          "kind": "signedUrl",
          "signedUrl": {
            "source": {
              "sign": {
                "endpoint": "get /images/{path}",
                "signature": {
                  "key": {
                    "param": "signing_key"
                  },
                  "signatureBase": [
                    "path",
                    {
                      "literal": "?"
                    },
                    "query"
                  ],
                  "encoding": "hex",
                  "queryField": "signature"
                }
              }
            },
            "action": "return"
          }
        }
      }
    }
  }
}
```

```json
{
  "resources": {
    "widgets": {
      "methods": {
        "list": "get /widgets",
        "all": {
          "kind": "alias",
          "aliasTo": "list"
        },
        "archive": {
          "kind": "alias",
          "aliasTo": "widgets.parts.archive",
          "positionalParams": [
            "widget_id"
          ]
        }
      },
      "subresources": {
        "parts": {
          "methods": {
            "archive": "post /widgets/{widget_id}/parts/{part_id}/archive"
          }
        }
      }
    }
  }
}
```

Each resource can carry generated methods, public models, nested subresources, default request options, and per-target visibility rules.

Use `skip` to omit a method, model, or resource globally or for specific targets. Use `only` to restrict it to a list of targets.

Signed uploads, signed URLs, dotted `aliasTo` addresses and an alias's own `positionalParams` are experimental, and may change in a later release.

A method with `"kind": "signedUpload"` wraps a two-step upload into one SDK method, as in the second example: it calls the operation at `endpoint`, sends a file to the pre-signed URL in the response property `signedUpload.urlField`, then calls the optional `confirm` endpoint (its path parameters filled from the first response by `confirm.pathParams`) and returns its response — or the first response when there is no confirm step. The operation at `endpoint` can also be placed as a method of its own, or kept out with `skip` or `ignoredEndpoints`.

The upload never carries the client's credentials: no auth headers, cookies, query authentication or default headers reach the upload URL. It sends the file, a `Content-Type`, and the headers the first response names in `headersField`. The `Content-Type` is the one `headersField` names, else `contentType`, else the type the file argument itself carries, else `application/octet-stream`. Only some file inputs carry a type: a `Blob`'s `type` (TypeScript), the type in a `(name, content, type)` or `(name, content, type, headers)` tuple (Python, where a `Content-Type` in the tuple's headers comes before `contentType` and the tuple's type), a reader's `ContentType()` method (Go), a `FilePart`'s `content_type` (Ruby) and a `FileParam`'s `contentType` (PHP, `application/octet-stream` unless set; a plain string carries none). None is guessed from a file name, and Java's `byte[]`, `Path` and `InputStream` (Kotlin's `ByteArray`, `Path` and `InputStream`) carry none. `method` is `put` (default) or `post`, and `body` is `binary` (default) or `multipart` under `multipartField`. It reuses the client's timeout and retry count, refuses a URL that is not `https:` (plain `http:` only to `localhost`, `127.0.0.1` or `::1`), and does not follow a redirect from the upload host. It reads the whole file into memory before the first request, so every retry sends the same bytes and a file that cannot be read creates no upload; that suits files that fit in memory, not multi-gigabyte single-request uploads. The method takes the initiating operation's path parameters, then the file, then its other parameters; `initiateParams: "path"` keeps only the path parameters, for an upload whose first request needs nothing else. It uses its own HTTP client, so transport settings on a custom `http_client` (Python), `fetch` or `httpClient` (TypeScript), `option.WithHTTPClient` or middleware (Go), `httpClient` (Java and Kotlin), the Ruby client's connection pool, or the `transporter` and middleware (PHP) do not apply to it. PHP sends it through its own HTTP stream wrapper, so it needs `allow_url_fopen` and does not go through a proxy.

Signed uploads are generated for TypeScript, Python, Go, Java, Kotlin, Ruby and PHP, and the CLI offers each one as a command; other targets leave the method out and report `Unsupported/SignedUploadMethod`. A configuration the generator cannot honour, such as a `urlField` the response does not declare, leaves the method out everywhere and reports `Config/InvalidSignedUpload`.

A method with `"kind": "alias"` gives an existing method a second public name, as in the fourth example. It is generated as a full method of the resource that declares it, under its own name, calling the target's endpoint with the target's request and response shape. `aliasTo` is either a sibling method's key (`list` in the example) or a dotted config address that names a method on any resource: resource keys as written, then the method key, as in `widgets.parts.archive`. Write `$client.<name>` for a method on the root client. A dotted address is always read from the root of `resources`, never relative to the alias's own resource.

An alias takes the target's `positionalParams` unless it lists its own, so the same call can take a different positional argument on each resource. In the example, the TypeScript SDK has `widgets.archive(widgetID, { part_id })` beside `widgets.parts.archive(partID, { widget_id })`. Positional arguments still follow the order the path declares them in. Set `deprecationMessage` to ship the alias as a deprecated name: a plain rename on the same resource points callers at the method it renames, and any other alias shows the message as written.

An alias whose `aliasTo` is missing, names no method, names a `webhookUnwrap`, `signedUpload` or `signedUrl` method, names another alias or closes a cycle of aliases, or whose `positionalParams` name a parameter the target has no path parameter for, is left out and reported as `Config/InvalidAlias`. An alias of a method that `skip`, `only` or `ignoredEndpoints` removes for a target is left out of that target with it.

To expose one endpoint under several request media types, place it once with one `bodyContentType` and declare each other method as an alias with `aliasTo` naming it and a `bodyContentType` of its own, as in `notes.create` sending `application/json` beside `notes.create_text` sending `text/plain`, both on `post /notes`. Like any alias, each takes everything but its name, media type, `positionalParams` and deprecation from the method it names. A second plain placement of the endpoint on the same resource is generated the same way, as an alias of the first one declared without a `deprecationMessage`, and its other settings (`streaming`, `bodyParamName`, `positionalParams` and the rest) are not applied; in different resources only the later placement is kept, and `Config/DuplicateEndpoint` is reported. A method or alias whose `bodyContentType` names a media type the operation does not declare is left out and reported as `Config/UnknownBodyContentType`. When that is the method the endpoint is generated from, every other method and alias placed on the endpoint is left out with it; when it is a second placement on the same resource, only an alias naming it that sets no `bodyContentType` of its own is, and that alias is reported too.

A method with `"kind": "webhookUnwrap"` generates a helper that verifies and decodes the webhook deliveries your server receives, configured under its `webhook` property; see [Webhooks](webhooks.md).

#### Signed URLs

> [!WARNING]
> Experimental: `kind: "signedUrl"` may change in a later release, before it is stable. Every target renders it today. An upload renders only where signed uploads do; other targets leave it out and report `Unsupported/SignedUploadMethod`.

A signed URL is a link that carries its own permission. The server checks a signature or token in the URL instead of a credential, so whoever holds the link can use it until it expires, without an API key. A method with `"kind": "signedUrl"` gets such a URL and does one thing with it, as in the third example. [Signed URLs](signed-urls.md) explains the feature, with more examples and every error message, and [Signed URL methods](configuration/signed-urls.md) lists every key.

`signedUrl.source` says where the URL comes from:

| Source | Use it when | Example |
| --- | --- | --- |
| `sign` | The API documents how to sign its URLs, and the SDK holds the secret. | An embed link, a CDN image link. |
| `request` | An API operation hands out the URL. | A presigned download or upload link to an object store. |
| `method` | Another `kind: signedUrl` method already gets the same URL. | Fetching the page that an embed-URL method returns. |

`signedUrl.action` says what the method does with it:

| Action | The method | Returns |
| --- | --- | --- |
| `"return"` | Makes no request. It is synchronous. | The URL, as a string. |
| `{ "fetch": { "accept": "text/html" } }` | Sends a `GET` to the URL. | The body, read as `returns` says. |
| `{ "upload": { … } }` | Sends a file to the URL. | The response that issued the URL, or the confirm step's. |

`kind: "signedUpload"` is the simple preset for uploads: it is a `request` source with the `upload` action, and both generate the same SDK.

##### How a signed URL is built

Take the `signed_image_url` method from the third example, called with `{ "path": "cat.png", "w": 400, "expires": 1767225600, "signing_key": "cdn_vector_key" }`:

1. **Path.** Each placeholder of `get /images/{path}` is filled from the param of the same name, percent-encoded: `/images/cat.png`.
2. **Query.** With no `query` set, the endpoint's query parameters (here `w`, `expires` and `signature`) are written in the order the API description declares them, each from the param of the same name, leaving out the `signature.queryField` one for now: `w=400&expires=1767225600`. A param the caller leaves out is left out of the URL. With no `params` set either, the params are the endpoint's path and query parameters, then the `signing_key` the key names.
3. **Signature base.** The `signatureBase` parts `["path", { "literal": "?" }, "query"]` are joined into the bytes to sign: `/images/cat.png?w=400&expires=1767225600`.
4. **HMAC.** HMAC-SHA256 of those bytes, keyed with `cdn_vector_key`, written as `hex`: `41c6b11e80333433c2736df263541315393eaa1f2b2ed736cd209f0c76b6ce2a`.
5. **URL.** The signature goes into the field `signature.queryField` names, after every other field: `<base URL>/images/cat.png?w=400&expires=1767225600&signature=41c6b11e80333433c2736df263541315393eaa1f2b2ed736cd209f0c76b6ce2a`.

The `get_embed_url` method signs a payload instead. Called with `{ "token": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "expiration": "2026-01-01T00:00:00Z" }`, it serializes the params as compact JSON in declaration order, `{"token":"3fa85f64-5717-4562-b3fc-2c963f66afa6","expiration":"2026-01-01T00:00:00Z"}`. `embed_request` carries that JSON in Base64, and `hmac` carries its HMAC-SHA256 under the API key `sk_test_embed_vector` in Base64: `Us35rpnRp1AXfogcXlY+o/Ch7ZmoVrjcYdPcflylpwU=`, written into the query as `Us35rpnRp1AXfogcXlY%2Bo%2FCh7ZmoVrjcYdPcflylpwU%3D`.

##### Signing keys

The key is never sent: it appears in neither the URL nor the payload, so build signed URLs server-side and never ship the key to a browser.

| `signature.key` | Use it when |
| --- | --- |
| `{ "clientOption": "api_key" }` | The key is a client setting, configured once: the API key, or a signing secret read from an environment variable. |
| `{ "param": "signing_key" }` | The caller passes the key on each call, such as a different secret per bucket or per tenant. |

A `clientOption` must name an option the client never sends to the API: a plain string option that sets none of `sendAsQueryParam`, `sendAsBodyParam`, `sendAsPathParam`, `sendInHeader`, `serverVariable` or `overridable`, or the one option bound to an `apiKey` or bearer security scheme. Any other option is refused.

##### Encodings

| `encoding` | Written as | What the server must expect |
| --- | --- | --- |
| `hex` | Lowercase hexadecimal, 64 characters for HMAC-SHA256. | The hex string as is. |
| `base64` | Standard Base64 with `+`, `/` and `=` padding. | The value percent-decoded first: the query writes `%2B`, `%2F` and `%3D`. |
| `base64url` | Base64 with `-` and `_`, without padding. | The value as is: nothing in it needs escaping. |

A `{ "payload": "<encoding>" }` query field takes the same three encodings for the payload.

##### Defaults and shared sources

Leave out what has one answer. `signature.format` defaults to `hmac`, the only signing scheme so far, and `signature.algorithm` to `hmac-sha256`, the only algorithm. `sign.payload` defaults to `json` when a query field or the signature base reads the payload. A `return` method's `returns` defaults to `{ "type": "string", "format": "uri" }`. A `fetch` method must still say what its body is in `returns`.

`sign.defaults` fills a param the caller leaves out with the current time plus an ISO 8601 duration: `{ "expiration": { "now": "PT1M" } }` makes the link expire one minute after it is built. The duration must be longer than zero and at most 100 years (`P36525D`). A JSON Schema `default` in `params` is never filled in.

`source: { "method": "get_embed_url" }` takes another method's whole source, its defaults and its params, so the method writes only its own `action`, `returns`, `summary` and `description`. Name a sibling by its key, or a method on another resource by its dotted address, `widgets.get_embed_url`. The named method must exist, must be a `kind: signedUrl` method, and must write its own `sign` or `request` source; this method must not declare `params`.

##### Fetching

A fetched URL is its own credential. The request carries none of the client's credentials, cookies, default headers or default query: only `accept` and, for a `request` source, the headers named by `headersField`. A redirect is refused rather than followed, and the URL's query is kept out of logs and errors. A signed URL is built on the client's base URL, so it goes through the client's own HTTP function. A requested URL points at another host, so it goes through the platform's HTTP function rather than a custom one set on the client, which might add the API's credentials. Both use the client's timeout and retries. A requested URL must be `https:` (plain `http:` only to a loopback host).

##### Common mistakes

- **No delimiter in the signature base.** `["path", "query"]` lets two different URLs join to the same bytes. Write `["path", { "literal": "?" }, "query"]`.
- **Fixed text as a bare string.** A bare string must be `payload`, `path` or `query`, so `"?"` fails to load. Write `{ "literal": "?" }`.
- **A key the client sends.** A `clientOption` that is sent as a header, query or body parameter would leak the key to the API, and is refused. Use a plain option, or the scheme's one credential.
- **Expecting a JSON Schema `default` to be filled in.** It is documentation only. Use `sign.defaults` for a time relative to the call.
- **A path placeholder from an optional param.** A placeholder's param must be listed in `params.required`, or the URL cannot be built.
- **A nested object or fractional number in what is signed.** Every SDK must write the same bytes, so the path, `{ "param": … }` fields and the payload take only strings, integers and booleans.

Signed URLs are generated for every target (`sign` → `return`, `sign` → `fetch`, `request` → `fetch`), and `request` → `upload` wherever signed uploads are. A target that does not render a method's flow leaves it out and reports `Unsupported/SignedUrlMethod`. A configuration the API description cannot honour, such as a query field the endpoint does not declare, leaves the method out everywhere and reports `Config/InvalidSignedUrl`. A block that does not fit together fails when the config loads, with a pointer to the key.

### targets

```json
{
  "targets": {
    "typescript": {
      "packageName": "@acme/api",
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

Client options can send values in headers, query parameters, body parameters, or path parameters, though not every target supports every location. They can also map to OpenAPI security schemes or server variables.

Set `idempotency.header` and the generated client sends a key in that header with every request except a `GET`, unless the caller supplied one. The key is generated once per call and resent unchanged on every retry of it. By default each SDK writes a random value after an SDK-specific prefix such as `scalar-go-`: a UUID, except in PHP, which writes 64 hex characters. `idempotency.key` changes that format, for an API that validates the key: `format` is `uuid-v4` (the default, random) or `uuid-v7` (RFC 9562, which starts with a 48-bit Unix millisecond timestamp so keys sort by creation time); `hyphens: false` writes the UUID as 32 lowercase hex characters; and `prefix` replaces the SDK's prefix, with `""` sending the bare UUID. The prefix may contain only letters, digits and `!#%&*+.^_|~-`. For example, `"idempotency": { "header": "Idempotency-Key", "key": { "format": "uuid-v7", "hyphens": false, "prefix": "" } }` sends keys like `0192f7c4e8a77b3c9d2e4f6a8b0c1d2e`. Leave `key` out to keep each SDK's existing keys. The older `idempotencyHeader` is deprecated: a config that sets it loads as `idempotency.header`.

### pagination

Define reusable pagination schemes in `pagination`, then bind them to methods with `paginated`. See [Pagination](pagination.md) for the full field vocabulary, one worked example per strategy, and the helpers each target generates.

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

Bind a scheme to a method with `paginated`, which takes a scheme name, or `false` to keep the method unpaginated:

```json
{
  "resources": {
    "users": {
      "methods": {
        "list": {
          "kind": "http",
          "endpoint": "get /users",
          "paginated": "cursor"
        }
      }
    }
  }
}
```

A scheme nothing references is reported as unused rather than silently ignored.

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

| Property | Description |
| --- | --- |
| [`nestedFormat`](#nestedformat) | Object/nested query serialization strategy. |
| [`arrayFormat`](#arrayformat) | Array query serialization strategy: `comma` (`ids=1,2`), `repeat` (`ids=1&ids=2`), `indices` (`ids[0]=1&ids[1]=2`) or `brackets` (`ids[]=1&ids[]=2`). When unset, the default depends on the target: TypeScript, Python, Ruby, PHP, C# and Go comma-join every list, Dart comma-joins every list except `pipeDelimited`/`spaceDelimited` ones, Java, Kotlin, C++ and Swift follow each parameter's OpenAPI `style`/`explode`, and Rust repeats every `form` list. On C++, Rust and Swift a configured format applies to `form` lists only. Go applies one format to every list of a request, so a parameter's `explode` does not change it there. |

#### nestedFormat

**Allowed values:** `"brackets"`, `"dots"`

#### arrayFormat

**Allowed values:** `"comma"`, `"repeat"`, `"indices"`, `"brackets"`

### multipartSettings

| Property | Description |
| --- | --- |
| [`arrayFormat`](#arrayformat-1) | Array serialization strategy for multipart/form-data fields. |

#### arrayFormat

**Allowed values:** `"comma"`, `"repeat"`, `"indices"`, `"brackets"`

### dateTimeSettings

#### fallbackFormats

**Type:** `string[]`

Experimental: may change in a later release. Extra date-time formats a generated SDK accepts when it parses a `format: date-time` response value that is not RFC 3339, for an API that writes, for example, `2026-07-31 17:51:09.77982`. They are tried after the formats each runtime already accepts, in the order listed. A value that names no offset is read as UTC, and requests keep sending RFC 3339. Patterns use a subset of the Java date-time pattern letters: `yyyy`, `MM`, `dd`, `HH`, `mm` and `ss`; `.S` to `.SSSSSSSSS` directly after `ss` for a fraction of a second, which is optional and up to nine digits long whatever the number of `S`; `X`, `XX` or `XXX` at the end for an offset, each accepting `Z`, `+HH`, `+HHMM` or `+HH:MM`; the separators `-`, `/`, `:`, `.`, `T` and space; quoted literal text such as `'at'`; and up to four `[...]` optional sections. Every pattern needs a full date, and hours and minutes go together. Applied by the Java, Kotlin, Go, Rust and PHP SDKs (Rust when date-times are not kept as strings; PHP tries them before its own lenient parser, which would read a day-first `01/02/2026` month-first). Java, Kotlin and PHP match each pattern exactly; Go and Rust parse with their standard libraries and also accept some looser spellings of it, such as single-digit fields, extra or missing spaces, longer fractions, and in Go a fraction after seconds that a pattern does not name. Other targets keep their own parsing rules, and diagnostics report the ones that parse date-times.

**Constraints:** `maxItems: 16`

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

```json
{
  "openapi": {
    "securitySchemeSettings": {
      "OAuth": {
        "resource": [
          "https://api.example.com"
        ],
        "audience": "https://api.example.com"
      }
    }
  }
}
```

These sit next to the source API document rather than in it: they override its security for the generated SDKs, transform it before generation, and control the code samples and tags written to the augmented OpenAPI document the generator writes, without editing the document you maintain.

`securitySchemeSettings` adds what an OpenAPI security scheme has no field for, keyed by scheme id. Unlike `securitySchemes`, an entry does not replace the scheme. For an OAuth 2.0 or OpenID Connect scheme, `resource` (RFC 8707 resource indicators) and `audience` name the API a token is requested for, so an authorization server that fronts several APIs issues one this API accepts. Each generated client that requests tokens sends them: the Rust SDK's client-credentials exchange, and every request the CLI's `login` makes, the refresh included. A key naming no OAuth 2.0 or OpenID Connect scheme does nothing, and generation reports it as `Config/UnusedSecuritySchemeSettings`.

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

| Property | Default | Description |
| --- | --- | --- |
| [`failOn`](#failon) | `"error"` | Lowest severity that fails the build; `off` means no severity fails it. |
| [`maxWarnings`](#maxwarnings) |  | Maximum allowed warnings before the build fails. |
| [`maxErrors`](#maxerrors) |  | Maximum allowed errors before the build fails. |
| `rules` |  | Per-rule severity override keyed by rule id (e.g. `Endpoint/NotConfigured`); `off` disables the rule. |
| `ignored` |  | Per-rule suppressions keyed by rule id. |

#### failOn

**Allowed values:** `"off"`, `"info"`, `"warn"`, `"error"`

#### maxWarnings

**Constraints:** `minimum: 0`

#### maxErrors

**Constraints:** `minimum: 0`
