<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand.

Published at https://scalar.com/products/sdk-generator/configuration/signed-urls, which is where the links to
pages outside this reference resolve.
-->
# Signed URL methods

> [!WARNING]
> Experimental: `kind: "signedUrl"` may change in a later release, before it is stable.

Every key a method with `"kind": "signedUrl"` reads, with its default and the rules the config is checked against, when it loads or when the SDK is generated. The method is declared under `resources`, like any other method. [Signed URLs](../signed-urls.md) explains how a signed URL is built, with worked examples, what a generated method sends, and every error message.

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

## signedUrl

**Type:** `object`

For `kind: signedUrl` methods, which are generated from config: the API description has no operation for them. A signed URL is a link that carries its own permission: the server checks a signature or token in the URL instead of a credential, so whoever holds the link can use it until it expires, without an API key. Use one to let a browser, an `<iframe>` or a CDN load something, or to download from or upload to an object store the API hands out links for. `source` says where the URL comes from: `sign` builds and signs it in the SDK with a shared secret (an embed link, a CDN image link), `request` asks an API operation for it (a presigned download or upload link), and `method` gets it exactly as another `kind: signedUrl` method does. `action` says what the method does with it: `"return"` hands the URL back without a request, `{ "fetch": {} }` downloads it, and `{ "upload": {} }` sends a file to it. `kind: signedUpload` is the simple preset for uploads: it is a `request` source with the `upload` action and generates the same SDK. A target that does not render a method's flow leaves the method out and reports `Unsupported/SignedUrlMethod`; a configuration the API description cannot honour leaves it out everywhere and reports `Config/InvalidSignedUrl`. Example: `{ "source": { "method": "get_embed_url" }, "action": { "fetch": { "accept": "text/html" } } }`.

### source

**Type:** `object`

**Required**

Where the URL comes from: exactly one of `sign` (the SDK builds and signs it), `request` (an operation's response holds it) or `method` (another `kind: signedUrl` method's URL). Example: `{ "request": { "endpoint": "post /v1/exports/{export_id}/download", "urlField": "download_url" } }`.

#### sign

**Type:** `object`

Builds the URL of a `get` operation in the SDK and, with a `signature`, signs it with a shared secret, the way a CDN or an embed endpoint expects. The params and query fields default to the operation's own parameters. No request is made to build it, so a `return` method is synchronous. Use it when the API documents how its URLs are signed and the SDK can hold the secret. Example: `{ "endpoint": "get /images/{path}", "signature": { "key": { "param": "signing_key" }, "signatureBase": ["path", { "literal": "?" }, "query"], "encoding": "hex", "queryField": "signature" } }`.

##### endpoint

**Type:** `string`

**Required**

The `get` operation whose URL is built, as `"get <path>"`. Only `get`: a signed URL is opened by a browser, an `<iframe>` or a CDN, which all send a plain `GET`. Each path placeholder is filled from the param of the same name, which must be required (or filled by `defaults`), percent-encoded as a path segment. A path that pins a query (`/files/{id}?download=true`) is refused: declare the field as a query parameter instead. So is an operation that requires a header or cookie parameter, other than the header a security scheme's credential goes in, since a browser opening the link sends neither. Its path and query parameters are the method's params when `params` is left out, and its query parameters are the URL's query fields when `query` is left out. The URL is the client's base URL, then the path, then `?` and the query. The operation is still generated as an ordinary method if a resource places it. Example: `"get /images/{path}"`.

**Constraints:** `pattern: ^get .+$`

##### payload

**Type:** `"json"`

Serializes the params into one value, the payload, which a `{ "payload": "<encoding>" }` query field carries and a `"payload"` signature base part signs. Optional: it defaults to `json` when a query field or the signature base reads the payload, and to none otherwise; `json` is the only value. A payload needs `params` written out, since it serializes them in the order `params` declares them. `json` writes the params as compact UTF-8 JSON: properties in the order `params` declares them (never the caller's order), absent ones left out rather than written as `null`, no whitespace, non-ASCII as UTF-8 rather than `\u` escapes, and a `param` signing key left out. A `date-time` string is written as given; a native date as UTC `YYYY-MM-DDTHH:MM:SSZ`, without fractional seconds. Example: `{ "token": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "expiration": "2026-01-01T00:00:00Z" }` serializes to `{"token":"3fa85f64-5717-4562-b3fc-2c963f66afa6","expiration":"2026-01-01T00:00:00Z"}`.

##### signature

**Type:** `object`

How the URL is signed. With `format` `hmac`, the default and only scheme so far: an HMAC of the `signatureBase` bytes under `key`, written as `encoding` into the query field `queryField` names, after every other field. Leave it out for a URL that carries no signature. Example: `{ "key": { "param": "signing_key" }, "signatureBase": ["path", { "literal": "?" }, "query"], "encoding": "hex", "queryField": "signature" }`.

###### format

**Type:** `"hmac"`

The signing scheme, which decides the rest of the block's keys. Optional: `hmac`, the default and only value so far, is an HMAC of the `signatureBase` bytes under `key`, written as `encoding` into the query field `queryField` names. It fits a server that dictates its own signing rules, such as a CDN or an embed endpoint. Standard schemes may be added as other values later; a block that leaves `format` out keeps meaning `hmac`. Example: `"hmac"`.

###### algorithm

**Type:** `"hmac-sha256"`

The MAC algorithm. Optional: `hmac-sha256`, the default and only value, computes HMAC-SHA256 keyed with the key's UTF-8 bytes over the signature base. Example: `"hmac-sha256"`.

###### key

**Type:** `object`

**Required**

Where the signing key comes from. Write `{ "clientOption": "<name>" }` when the key is a client setting, configured once (the API key, or a signing secret read from an environment variable); write `{ "param": "<name>" }` when the caller passes it on each call (a different secret per bucket or per tenant). The key is never sent: it appears in neither the URL nor the payload. Example: `{ "clientOption": "api_key" }`.

###### clientOption

**Type:** `string`

A `clientSettings.opts` entry that holds the key, read through the client's credential resolution, so a token provider works too (a `return` method needs one that answers synchronously). A signing key must never be sent to the API, so the option must stay on the client: either a plain string option that sets none of `sendAsQueryParam`, `sendAsBodyParam`, `sendAsPathParam`, `sendInHeader`, `serverVariable`, `overridable` or `defaultValue`, or the one option bound to a declared `apiKey` or bearer security scheme, holding its value. Any other option is refused with `Config/InvalidSignedUrl` when the SDK is generated, since one the client sends would leak the key to the API on every call. One that otherwise qualifies but sets a `defaultValue` fails to load instead, since the default would write the key into the generated SDK for anyone who installs it to read. Read the key from an environment variable instead. Example: `"api_key"`.

**Constraints:** `minLength: 1`

###### param

**Type:** `string`

A string param the caller passes the key in. It is left out of the payload, the path and the query, and may not fill a path placeholder or a `{ "param": … }` field. With `params` written out, it must be one of its properties and be listed in `params.required`, since no URL can be signed without it. When `params` is left out, the method takes it as a required string param after the endpoint's parameters. Example: `"signing_key"`.

**Constraints:** `minLength: 1`

###### signatureBase

**Type:** `(string | object)[]`

**Required**

The signature base: the parts joined, in order, into the bytes the HMAC is computed over (RFC 9421's term, <https://www.rfc-editor.org/rfc/rfc9421#name-creating-the-signature-base>; AWS, Google Cloud Storage and Azure call it the string to sign). A part is a token or a literal. `"payload"` is the serialized payload. `"path"` is the path as it appears in the URL, percent-encoded, without the base URL's own path prefix: `/images/cat.png` even when the base URL is `https://cdn.example.com/v2`. `"query"` is the query as encoded in the URL, every field except the `queryField` one, without the leading `?`: `w=400&expires=1767225600`. `{ "literal": "?" }` is fixed text, signed as written. Literals are objects so that a mistyped token (`"querry"`) fails when the config loads instead of being signed as text, which would only show up as every URL being rejected. Nothing separates the parts, so put a literal delimiter between two that vary; without one, two different URLs can join to the same bytes and share a signature: with `["path", "query"]`, the path `/images/a` with the query `w=1` and the path `/images/aw=1` with no query both sign `/images/aw=1`. Two rules keep a signature checkable, and a method that breaks either is not generated. Something varies: at least one part must change from one URL to the next (a `"path"` with a placeholder, a `"query"` with a field that reads a param or the payload, or a `"payload"` with properties), or the signature would work as one reusable token for every URL. What is signed is sent: the server rebuilds the signature base from the request it receives, so a `"payload"` part needs the payload in a `{ "payload": … }` query field, or every param it serializes sent as a query field or a path placeholder. Example: `["path", { "literal": "?" }, "query"]` signs `/images/cat.png?w=400&expires=1767225600`.

**Constraints:** `minItems: 1`

###### literal

**Type:** `string`

**Required**

Fixed text signed as written, such as `?`, `\n` or a version prefix. It must not be empty. Example: `"?"`.

###### encoding

**Type:** `"base64" | "base64url" | "hex"`

**Required**

How the signature bytes are written into the URL, which must match what the server compares against. `hex` is lowercase hexadecimal, 64 characters for HMAC-SHA256. `base64` is standard Base64 with `+`, `/` and `=` padding, which the query percent-encodes (`%2B`, `%2F`, `%3D`), so the server must decode the query before comparing. `base64url` uses `-` and `_` and drops the padding, so it travels unescaped. Example: `"hex"`.

###### queryField

**Type:** `string`

**Required**

The query parameter of `endpoint` that carries the signature, by wire name. It must be a query parameter the API description declares. It is written after every other field, is never part of the `"query"` signature base part, and is not one of the method's params when `params` is left out. Do not list it in `query`. Example: `"signature"`, or `"hmac"` for an embed link.

**Constraints:** `minLength: 1`

##### query

**Type:** `Record<string, object>`

The URL's query fields, keyed by wire name, in the order the URL writes them, to override the default. Optional: left out, the URL writes every query parameter of `endpoint` in the order the API description declares them, each filled from the param of the same name and left out when the caller leaves it out or passes `null`; the `signature.queryField` one carries the signature. Write `query` when the server expects another order, or for a field filled from the payload or with fixed text. Then each key must be a query parameter of `endpoint`, every required one but the signature's must be listed, and the signature's field must not be: it is always written last. Only the listed fields are written, in the order listed. A value is `{ "param": "<name>" }`, `{ "payload": "base64" | "base64url" | "hex" }` or `{ "literal": "<text>" }`; a bare string fails to load. Names and values are percent-encoded the same way in every SDK: RFC 3986 unreserved characters (`A`–`Z`, `a`–`z`, `0`–`9`, `-`, `.`, `_`, `~`) stay, and every other UTF-8 byte becomes uppercase `%XX` (a space is `%20`, never `+`). Examples: `{ "embed_request": { "payload": "base64" } }` with `signature.queryField` `"hmac"` writes `?embed_request=eyJ0…&hmac=Us35…`; `{ "expires": { "param": "expires" }, "w": { "param": "w" } }` suits a server that signs `expires` first.

###### param

**Type:** `string`

The param whose value the field carries, by name. It must be a string, integer or boolean param, and never the signing key. The field is left out when the caller leaves the param out or passes `null`. Example: `"w"`.

**Constraints:** `minLength: 1`

###### payload

**Type:** `"base64" | "base64url" | "hex"`

How the payload is encoded into the field: `base64` (standard, padded), `base64url` (no padding) or `hex` (lowercase). Example: `"base64"`.

###### literal

**Type:** `string`

The value the field always carries, in every URL, percent-encoded and signed like any other field. Example: `"1"`.

##### defaults

**Type:** `Record<string, object>`

Values filled in when the caller leaves a param out, keyed by the param's name; usually an expiry. `{ "now": "<duration>" }` is the current UTC time plus an ISO 8601 duration, written in the param's format: a `date-time` string param gets an RFC 3339 time (`2026-01-01T00:01:00Z`), and an integer param with no `format`, `int64` or `unix-time` gets Unix seconds (`1767225660`). No other param takes a default: an `int32` integer overflows in 2038, another `format` such as `unix-time-ms` counts a different unit, and an integer whose `maximum` is below any current Unix time holds something else, such as a lifetime in seconds. Defaults apply to a copy of the caller's params, and a param that has one is optional in the method's params. A defaulted param must be sent: read by a query field, held by a path placeholder, or serialized into a payload a query field carries. When the URL is signed it must be signed too (read by a query field the `"query"` part signs, serialized into a signed `"payload"`, or a placeholder of a signed `"path"`), since an expiry that is sent but not signed could be pushed out by anyone holding the URL; a method that breaks either rule is not generated. A JSON Schema `default` in `params` is never filled in, since it can hold only a fixed value; a time relative to the call goes here. Example: `{ "expiration": { "now": "PT1M" } }` makes the link expire one minute after it is built.

###### now

**Type:** `string`

**Required**

An ISO 8601 duration added to the current UTC time: `PT1M` (one minute), `PT15M`, `P1D`, `P1DT12H`. Weeks, days, hours, minutes and whole seconds only: years and months vary in length, and every SDK must add the same number of seconds, so `P1M` (one month) is refused, and one minute is `PT1M`. A fraction of a second is refused too, since a signed time is written to the whole second. It must be longer than zero (`PT0S` would expire as it is made) and at most 100 years (`P36525D`), the furthest every SDK can count. Example: `"PT1M"`.

**Constraints:** `pattern: ^P(?=\d|T\d)(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$`

#### request

**Type:** `object`

Calls the operation at `endpoint`, whose response holds the URL, such as an object store's presigned download or upload link. The method takes that operation's parameters. These are the keys and rules of `kind: signedUpload`'s first step. Example: `{ "endpoint": "post /v1/exports/{export_id}/download", "urlField": "download_url" }`.

##### endpoint

**Type:** `string`

**Required**

The operation that answers with the URL, as `"<verb> <path>"`. The method takes its parameters the way a generated method for it would (see `initiateParams`). Example: `"post /v1/exports/{export_id}/download"`.

**Constraints:** `pattern: ^(delete|get|head|options|patch|post|put|trace) .+$`

##### urlField

**Type:** `string`

**Required**

Where the URL is in that operation's response, as a dot-separated path of wire names. When the response schema types the field, it must be a string. The URL must be `https:` (plain `http:` only to `localhost`, `127.0.0.1` or `::1`) and carry no user name or password. Example: `"download_url"`, or `"data.link.url"` for a nested one.

**Constraints:** `minLength: 1`

##### headersField

**Type:** `string`

Where that response holds a string map of headers the request to the URL must carry, such as a content type the link was signed for, as a dot-separated path of wire names. When the response schema types the field, it must be an object whose values are strings. The client's credentials and default headers never reach the URL's host: a `fetch` sends only these and `Accept`, and an `upload` only these and `Content-Type`. With the `fetch` action, a header the HTTP transport controls (`Host`, `Content-Length`, `Cookie`, any `Proxy-*` or `Sec-*`), or one whose value is not a string, is refused before any request. Example: `"download_headers"`.

**Constraints:** `minLength: 1`

##### initiateParams

**Type:** `"all" | "path"`

Which of the operation's parameters the method takes: `all` (default), or only its `path` parameters for an operation that needs nothing else, which is then sent with no body, query, header or cookie parameters, so it must require none. Example: `"path"`.

#### method

**Type:** `string`

Gets the URL exactly as another `kind: signedUrl` method does, so two methods that build or request the same URL write it once. This method takes that method's whole `source`, including its `defaults`, and its `params`; it writes only its own `action`, `returns`, `summary` and `description`, and must not declare `params`: remove them, or write the `source` out in full to give this method params of its own. Both take the same properties, each under a params type of its own name (`WidgetGetEmbedURLParams`, `WidgetGetEmbedHTMLParams`). Name a method on the same resource by its key (`"get_embed_url"`), or one elsewhere by a dotted address read from the root of `resources`: the resource keys as written, then the method key (`"widgets.get_embed_url"`). The config fails to load when the name matches no method, names this method, names a method of another kind, or names a method that itself uses `source.method` (name the method that writes the source instead). Example: `"get_embed_url"` on a `fetch` method beside the `return` method of that name.

**Constraints:** `minLength: 1`

### action

**Type:** `"return" | object`

**Required**

What the method does with the URL: `"return"` returns it as a string with no request, so the method is synchronous; `{ "fetch": { … } }` sends a `GET` to it and returns the body; `{ "upload": { … } }` sends a file to it and returns the response that issued the URL, or the confirm step's. Example: `"return"`.

#### fetch

**Type:** `object`

Downloads the URL: sends a `GET` to it and returns the body, read as `returns` says. The URL is its own credential, so the request carries none of the client's credentials, cookies, default headers or default query: only `accept` and, for a `request` source, the headers `headersField` names. A redirect is refused rather than followed, since following it could hand the URL to another host, and the URL's query is kept out of logs and error messages. A signed URL is built on the client's base URL, so it is sent through the client's own HTTP function; a requested URL points at another host, such as an object store, so it is sent through the platform's HTTP function rather than a custom one set on the client, which might add the API's credentials. Both use the client's timeout and retries. Example: `{ "fetch": { "accept": "text/html" } }`.

##### accept

**Type:** `string`

`Accept` header the `GET` sends, exactly as written. Optional, with no default: without it the SDK adds no `Accept` header of its own. It must be a valid HTTP header value (visible ASCII, with spaces and tabs only between visible characters), or the config fails to load. Example: `"text/html"`.

**Constraints:** `minLength: 1`

#### upload

**Type:** `object`

Sends a file to the URL, as `kind: signedUpload` does, and returns the response that issued the URL, or the confirm step's, so the method takes no `returns`. It needs a `request` source. The file goes without the client's credentials, to an `https:` URL, without following a redirect, and reading the whole file into memory once so every retry sends the same bytes. Example: `{ "upload": { "method": "put" } }`.

##### method

**Type:** `"put" | "post"`

HTTP method the file is sent with: `put` (default) or `post`. Example: `"post"`.

##### body

**Type:** `"binary" | "multipart"`

How the file becomes the body: `binary` (default) sends the file as is; `multipart` sends a form with the file under `multipartField`. Example: `"multipart"`.

##### multipartField

**Type:** `string`

Form field the file is sent under with `multipart`. Defaults to `file`. Example: `"document"`.

**Constraints:** `minLength: 1`

##### contentType

**Type:** `string`

`Content-Type` of a `binary` upload. Without it the file's own type is used when it carries one, then `application/octet-stream`; a `Content-Type` named by `headersField` wins, because the link may be signed for it. Example: `"image/png"`.

**Constraints:** `minLength: 1`

##### fileParam

**Type:** `string`

Name of the file argument, before target casing. Defaults to `file`. Example: `"image"`.

**Constraints:** `pattern: ^[A-Za-z_][A-Za-z0-9_]*$`

##### confirm

**Type:** `object`

An operation called once the upload succeeds, its path filled from the response that issued the URL, so it needs a `request` source. Without it the method returns that response. Example: `{ "endpoint": "post /files/{file_id}/complete", "pathParams": { "file_id": "id" } }`.

###### endpoint

**Type:** `string`

**Required**

Operation called after the upload succeeds, as `"<verb> <path>"`. Its response becomes the method's return value. It may be an endpoint no other method places, so a confirm step the SDK does not otherwise expose still works.

**Constraints:** `pattern: ^(delete|get|head|options|patch|post|put|trace) .+$`

###### pathParams

**Type:** `Record<string, string>`

Fills each path parameter of the confirm endpoint, keyed by its wire name, from a property of the initiating response, written as a dot-separated path of wire names (`id`, `upload.id`). Every path parameter must be named here, except one a client option supplies (`clientSettings.opts.<name>.sendAsPathParam`), which the client fills unless it is named; the confirm step sends no body, query or header parameters of its own.

### summary

**Type:** `string`

Summary shown on the generated method. Defaults to the summary of the operation the URL comes from, for a method with `source.method` too: it never takes the named method's own `summary`. Example: `"Build a signed image URL"`.

### description

**Type:** `string`

Description shown on the generated method. Defaults to the description of the operation the URL comes from, for a method with `source.method` too: it never takes the named method's own `description`. Example: `"Builds a link to the image that works without an API key."`.

## params

For `kind: signedUrl` methods with a `sign` source: the method's one argument, as an inline object schema or a `$ref` into the API description. Optional: left out, the params are the `sign` endpoint's path parameters, then its query parameters, in the order the API description declares them, with its schemas, descriptions and `required` flags. The signature's `queryField` is left out, and so is every query parameter an explicit `query` does not read with `{ "param": … }` (one it fills with a literal, say). With no `query`, an optional query parameter that is not a string, integer or boolean (an array, an object, a fractional number) is left out, since no SDK could sign it the same way, and a required one fails generation. A param a `defaults` entry fills is optional, even when the API description requires it: the URL still carries it, filled with the default. A `param` signing key is added last as a required string. Write `params` when the URL carries a payload, which serializes them, or to name or type them differently. It compiles into a params model like an operation's, with the same docs, exports and manifest entry. Its properties fill the endpoint's path placeholders and `{ "param": … }` query fields by name, and the payload serializes them in the order declared here. With no `query`, each query parameter of the endpoint is filled from the property of the same name; an optional one with no such property is left out of every URL, and a required one fails generation. A path placeholder's property must be listed in `required`, unless a `defaults` entry fills it, since an optional one would leave a literal `{path}` in the URL, so the method is not generated; parameters read from the API description are always fine, since OpenAPI path parameters are required. A property a `defaults` entry fills must not be listed in `required`: the caller could never leave it out, so the default would never apply. A property the path, a `param` field or the payload reads must be a string, integer or boolean (`null` is allowed except on the path), because a nested object, an array or a fractional number has no spelling every SDK writes the same (languages disagree on how to write `0.00005`): send a number with a fixed precision as an integer or a string. A JSON Schema `default` on a property is documentation only and is never filled in: use `source.sign.defaults`. Leave `params` out with a `request` source (the method takes the operation's parameters) and with `source.method` (it takes the named method's). Example: `{ "type": "object", "required": ["token"], "properties": { "token": { "type": "string" }, "expiration": { "type": "string", "format": "date-time" } } }`, or `{ "$ref": "#/components/schemas/EmbedRequest" }`.

## returns

**Type:** `object`

For `kind: signedUrl` methods: what the method returns. With `return` it is optional and defaults to `{ "type": "string", "format": "uri" }`; one you write must be a string schema that is not `binary`. Such a method makes no request, so it is synchronous. With `fetch` it is required, and it decides how the body is read: `{ "type": "string", "format": "binary" }` returns the raw response; any other string schema (another `format`, a string `enum`, or a `$ref` to one) returns the body as text, never JSON-decoded; anything else is decoded as JSON like any other response. `{}`, `{ "async": true }` alone and `{ "type": "null" }` name no type and fail to load with `fetch`. With `upload` it is left out: the method returns the response that issued the URL, or the confirm step's. Example: `{ "type": "string" }` for an HTML page.

### async

**Type:** `boolean`

Whether the method is asynchronous. The action decides it, so this key may only restate that: a `return` method makes no request and is synchronous (leave `async` out, or set it to `false`), and a `fetch` method sends one and is asynchronous (leave it out, or set it to `true`). Named `async` rather than `sync`, because Python already has a sync client and the word would mean two things.

### native

**Type:** `Record<string, string>`

Reserved: a language-native return type per target, to replace the type the schema would generate there (`httpx.URL` instead of `str`). Python, Go, Ruby, PHP, Kotlin, Java, C#, C++ and Dart read it for a `return` method. Python takes `str` or `httpx.URL`, and refuses any other name when the SDK is generated. Ruby parses the URL into the type it names (`URI::HTTPS`, through `URI.parse`; any other class through its own `parse`). In PHP, `Psr\Http\Message\UriInterface` returns the URL built through the client's URI factory, `string` the string, and any other class name fails PHP generation, since the SDK has no way to build it. Go takes `*url.URL` or `string`, Kotlin and Java `java.net.URI`, `java.net.URL` or `String`, C# `System.Uri` or `string`, and C++ `std::string` or `std::filesystem::path`; each fails generation for any other type. Dart returns a `Uri` for `Uri` (through `Uri.parse`) and the string for `String`, and fails generation on any other type. Every other target that renders signed URLs returns the string; a value is still checked when the config loads, as a qualified type name in that target's own spelling. Example: `{ "python": "httpx.URL", "go": "*url.URL" }`.
