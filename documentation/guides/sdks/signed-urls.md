# Signed URLs

<scalar-callout type="warning" icon="phosphor/regular/warning">
  Signed URL methods are experimental. The config shape may change in a later release, before it is stable. TypeScript, Python, Go, Java, Kotlin, Ruby, PHP, C#, C++, Dart and the CLI render them today; other targets leave them out and report `Unsupported/SignedUrlMethod`, except uploads, which render wherever `kind: signedUpload` does.
</scalar-callout>

A `kind: signedUrl` method generates an SDK method that gets a signed URL and does one thing with it: returns it, downloads it, or uploads a file to it. This page explains what a signed URL is and how one is checked, then how to configure the method, key by key.

## How signed URLs work

A signed URL is a link that carries its own permission. The server that answers it checks a signature or a token in the URL instead of an API credential, so whoever holds the link can use it until it expires, with no API key.

Use one when something other than your API client has to load a resource:

- an embed link a browser opens in an `<iframe>`;
- an image link a CDN serves without ever seeing the API key;
- a presigned download link to an object store, which the API hands out;
- a presigned upload link, which the API hands out and the SDK sends a file to.

There are two ways to get such a link. Either your side signs it with a secret it shares with the server, or the API signs it and hands it to you.

### Signing with a shared secret

Your server and the server that checks the link hold the same secret key. The SDK builds the URL and computes an HMAC-SHA256 of its exact bytes under the key: the path, the query, or a payload, joined in an order the config fixes. It writes the result, the signature, into one more query parameter. The key itself never goes into the URL.

```text
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│    Your server    │     │  Browser or user  │     │     CDN or API    │
│ SDK + signing key │     │    holds no key   │     │  same signing key │
└─────────┬─────────┘     └─────────┬─────────┘     └─────────┬─────────┘
          │                         │                         │
          │ 1. build the URL and    │                         │
          │    sign it with the key │                         │
          │                         │                         │
          │ 2. the signed URL       │                         │
          ├────────────────────────►│                         │
          │    as an iframe src, an │                         │
          │    img src or a link    │                         │
          │                         │                         │
          │                         │ 3. GET the signed URL   │
          │                         ├────────────────────────►│
          │                         │                         │ 4. rebuild the signed
          │                         │                         │    bytes from the request
          │                         │                         │ 5. HMAC them with its key
          │                         │                         │ 6. compare with the URL's
          │                         │                         │    signature, in
          │                         │                         │    constant time
          │                         │                         │ 7. check the expiry
          │                         │                         │
          │                         │ 8. 200 and the content, │
          │                         │    or 403 if any check  │
          │                         │    fails                │
          │                         │◄────────────────────────┤
```

The checking server repeats the work from the request it receives. It rebuilds the signed bytes from the path and query as they arrived, leaving out the signature, computes the HMAC with its own copy of the key, and compares the result with the signature in the URL. The comparison runs in constant time, so how long it takes does not reveal how many characters matched. Then it checks the expiry. A change to any signed byte, such as a wider image, a later expiry or another file, gives a different HMAC, and the request is refused.

The signed bytes are called the signature base, [RFC 9421's term](https://www.rfc-editor.org/rfc/rfc9421#name-creating-the-signature-base). AWS, Google Cloud Storage and Azure call it the "string to sign". Both sides must build it byte for byte the same way: the same order of query fields, the same percent-encoding, the same delimiters. That is why the config spells each of these out, and why every SDK writes the same bytes for the same call.

Anyone who holds the link can use it, so sign an expiry into it. Sign the URL on your server, never in a browser: the URL carries no credential, but signing needs the key.

### Asking the API for a presigned URL

Some APIs sign the URL themselves. An object store's upload and download links work this way. The SDK calls an API operation with its usual API key, and the response holds a URL, plus any headers the request to it must carry. The SDK then sends the file to that URL, or downloads from it, without the API key: the URL is its own credential, and it usually points at another host. The SDK holds no signing secret in this model.

```text
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│      Your API     │     │  Your code + SDK  │     │    Object store   │
│   issues the URL  │     │ holds the API key │     │   checks the URL  │
└─────────┬─────────┘     └─────────┬─────────┘     └─────────┬─────────┘
          │                         │                         │
          │ 1. POST /files          │                         │
          │    with the API key     │                         │
          │◄────────────────────────┤                         │
          │ 2. { upload_url,        │                         │
          │      upload_headers }   │                         │
          │    or a download URL    │                         │
          ├────────────────────────►│                         │
          │                         │                         │
          │                         │ 3. PUT the file to      │
          │                         │    upload_url, or GET   │
          │                         │    the download URL,    │
          │                         │    with upload_headers  │
          │                         │    and NO API key       │
          │                         ├────────────────────────►│
          │                         │ 4. 200, or the bytes    │
          │                         │◄────────────────────────┤
          │                         │                         │
          │ 5. optional confirm:    │                         │
          │    POST /files/{id}/    │                         │
          │    complete, API key    │                         │
          │◄────────────────────────┤                         │
          │ 6. the stored file      │                         │
          ├────────────────────────►│                         │
```

Step 5 is optional: some APIs want to hear that the upload finished before they record the file.

## Source and action

Every `kind: signedUrl` method combines a source, where the URL comes from, with an action, what the method does with it.

| | `return`: give back the URL | `fetch`: download it | `upload`: send a file to it |
| --- | --- | --- | --- |
| **`sign`**: build and sign the URL locally | Returns the URL as a string. No request, so the method is synchronous. TypeScript, Python, Go, Java, Kotlin, Ruby, PHP, C#, C++, Dart and the CLI. | Builds the URL, sends a `GET` to it and returns the body. TypeScript, Python, Go, Java, Kotlin, Ruby, PHP, C#, C++, Dart and the CLI. | Not rendered by any target: there is no API response to upload against. |
| **`request`**: read the URL from an API response | Not rendered by any target yet. | Calls the operation, then sends a `GET` to the URL without the API key and returns the body. TypeScript, Python, Go, Java, Kotlin, Ruby, PHP, C#, C++, Dart and the CLI. | Calls the operation, sends the file to the URL without the API key, then optionally confirms. TypeScript, Python, Go, Java, Kotlin, Ruby, PHP and the CLI. This is `kind: signedUpload`. |

A combination no target renders still loads, but the method is left out of every SDK and reported as `Unsupported/SignedUrlMethod`. The exception is a `sign` source with an upload `confirm`, which fails to load.

A third source, [`source.method`](configuration/signed-urls.md#method), takes the URL from another `kind: signedUrl` method, so one URL can be both returned and fetched without writing its signing twice.

## Start here

Say your API serves an embeddable widget. The caller sends the widget's settings as Base64 JSON in `embed_request`, and an HMAC-SHA256 of that JSON, keyed with the API key, in `hmac`. You want one SDK method that builds the link, and one that fetches the page behind it.

<scalar-steps>
  <scalar-step id="signed-url-operation" title="Describe the operation">

The OpenAPI document declares the endpoint the link points at. `security: []` because the link carries a signature, not the API key:

```yaml
components:
  securitySchemes:
    ApiKeyAuth: { type: apiKey, in: header, name: X-Api-Key }
paths:
  /v1/embed/widget:
    get:
      operationId: embedWidget
      security: []
      parameters:
        - { name: embed_request, in: query, required: true, schema: { type: string } }
        - { name: hmac, in: query, required: true, schema: { type: string } }
      responses:
        '200':
          description: The embedded widget.
          content:
            text/html:
              schema: { type: string }
```

  </scalar-step>

  <scalar-step id="signed-url-sign" title="Add a method that builds and signs the URL">

```json
{
  "clientSettings": {
    "opts": {
      "api_key": { "type": "string", "readEnv": "ACME_API_KEY", "securityScheme": "ApiKeyAuth" }
    }
  },
  "resources": {
    "widgets": {
      "methods": {
        "get_embed_url": {
          "kind": "signedUrl",
          "params": {
            "type": "object",
            "required": ["token"],
            "properties": {
              "token": { "type": "string", "format": "uuid" },
              "expiration": { "type": "string", "format": "date-time" }
            }
          },
          "signedUrl": {
            "source": {
              "sign": {
                "endpoint": "get /v1/embed/widget",
                "query": { "embed_request": { "payload": "base64" } },
                "signature": {
                  "key": { "clientOption": "api_key" },
                  "signatureBase": ["payload"],
                  "encoding": "base64",
                  "queryField": "hmac"
                },
                "defaults": { "expiration": { "now": "PT1M" } }
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

| Key | What it says here |
| --- | --- |
| `kind` | The method is generated from config. The API description has no operation for it. |
| `params` | The method's one argument. It is written out because the URL carries a payload, which serializes these properties in this order. |
| `source.sign.endpoint` | The link points at `GET /v1/embed/widget`, on the client's base URL. |
| `source.sign.query` | `embed_request` carries the payload, Base64-encoded. `hmac` is not listed: `queryField` names it. |
| `signature.key` | The HMAC is keyed with the client's `api_key` option. |
| `signature.signatureBase` | Sign the payload, and nothing else. |
| `signature.encoding` | Write the HMAC as standard Base64. |
| `signature.queryField` | The signature goes in `hmac`, after every other field. |
| `source.sign.defaults` | A caller who leaves out `expiration` gets the time one minute from now. |
| `action` | Return the URL. No request is made. |

  </scalar-step>

  <scalar-step id="signed-url-usage" title="Call it">

```ts
const client = new Acme(); // reads ACME_API_KEY

// Builds and signs the URL. No request, so no `await`.
const url = client.widgets.getEmbedURL({ token: '3fa85f64-5717-4562-b3fc-2c963f66afa6' });
```

`expiration` was left out, so the method fills it with the time one minute from now before signing. Call it on your server and hand the URL to the browser, for example as an `<iframe>` `src`.

  </scalar-step>

  <scalar-step id="signed-url-fetch" title="Add a method that fetches the page">

A second method reuses the first one's URL with `source.method` and fetches it, so the signing is written once:

```json
"get_embed_html": {
  "kind": "signedUrl",
  "returns": { "type": "string" },
  "signedUrl": {
    "source": { "method": "get_embed_url" },
    "action": { "fetch": { "accept": "text/html" } }
  }
}
```

It takes the same params as `get_embed_url`, builds the same URL, then sends a `GET` with `Accept: text/html` and returns the body as a string:

```ts
const html = await client.widgets.getEmbedHTML({ token: '3fa85f64-5717-4562-b3fc-2c963f66afa6' });
```

  </scalar-step>
</scalar-steps>

## How a signed URL is built

Two worked examples, with the values the shared test vectors pin, so you can check every step against your server.

### A CDN image link

A CDN serves images at `GET /images/{path}` and expects a hex HMAC-SHA256 of the path and query in a query parameter named `signature`. Use whatever name your server checks. The OpenAPI document declares the parameters:

```yaml
/images/{path}:
  get:
    operationId: getImage
    security: []
    parameters:
      - { name: path, in: path, required: true, schema: { type: string } }
      - { name: w, in: query, schema: { type: integer } }
      - { name: expires, in: query, schema: { type: integer } }
      - { name: caption, in: query, schema: { type: string } }
      - { name: signature, in: query, required: true, schema: { type: string } }
```

The method needs neither `params` nor `query`. Both come from the operation:

```json
"signed_image_url": {
  "kind": "signedUrl",
  "signedUrl": {
    "source": {
      "sign": {
        "endpoint": "get /images/{path}",
        "signature": {
          "key": { "param": "signing_key" },
          "signatureBase": ["path", { "literal": "?" }, "query"],
          "encoding": "hex",
          "queryField": "signature"
        }
      }
    },
    "action": "return"
  }
}
```

The generated method takes `{ path, w?, expires?, caption?, signing_key }`: the path parameter, then the query parameters in document order, with `signature` left out because the signature fills it, and the `param` signing key added last as a required string.

```ts
const url = client.images.signedImageURL({
  path: 'cat.png',
  w: 400,
  expires: 1767225600,
  signing_key: process.env['CDN_SIGNING_KEY'],
});
```

Here is that call with `signing_key: 'cdn_vector_key'`, step by step:

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ 1. params, as the caller passes them                                                 │
│    path = "cat.png"    w = 400    expires = 1767225600                               │
│    signing_key = "cdn_vector_key"    (signs the URL; never written into it)          │
└──────────────────────────────────────────┬───────────────────────────────────────────┘
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ 2. path and query, from the endpoint's parameters                                    │
│    path    /images/{path}        ►  /images/cat.png                                  │
│    query   w, expires, caption   ►  w=400&expires=1767225600                         │
│            (document order; caption was not passed, so it is left out)               │
└──────────────────────────────────────────┬───────────────────────────────────────────┘
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ 3. signature base: "path" + { "literal": "?" } + "query", nothing between            │
│    /images/cat.png?w=400&expires=1767225600                                          │
└──────────────────────────────────────────┬───────────────────────────────────────────┘
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ 4. HMAC-SHA256 of those bytes, keyed with the UTF-8 bytes of "cdn_vector_key"        │
│    32 raw bytes: 0x41 0xc6 0xb1 0x1e 0x80 0x33 …                                     │
└──────────────────────────────────────────┬───────────────────────────────────────────┘
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ 5. encoding: "hex" (lowercase, 64 characters)                                        │
│    41c6b11e80333433c2736df263541315393eaa1f2b2ed736cd209f0c76b6ce2a                  │
└──────────────────────────────────────────┬───────────────────────────────────────────┘
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ 6. URL: base URL + path + "?" + query, then queryField "signature" last (wrapped)    │
│    https://cdn.example.com/images/cat.png?w=400&expires=1767225600                   │
│    &signature=41c6b11e80333433c2736df263541315393eaa1f2b2ed736cd209f0c76b6ce2a       │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

The query is written in document order, `w`, `expires`, `caption`, and `caption` is left out because the caller did not pass it. To check the URL, the CDN rebuilds `/images/cat.png?w=400&expires=1767225600` from the request, leaving out `signature`, computes the same HMAC with its copy of `cdn_vector_key`, compares, and checks that `expires` has not passed.

### An embed link

The [Start here](#start-here) method signs a payload instead of the path and query. Its signing part:

```json
"query": { "embed_request": { "payload": "base64" } },
"signature": {
  "key": { "clientOption": "api_key" },
  "signatureBase": ["payload"],
  "encoding": "base64",
  "queryField": "hmac"
}
```

Called with `{ "token": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "expiration": "2026-01-01T00:00:00Z" }` and the API key `sk_test_embed_vector`, the JSON payload feeds both query fields:

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ 1. params, as the caller passes them                                                 │
│    token = "3fa85f64-5717-4562-b3fc-2c963f66afa6"                                    │
│    expiration = "2026-01-01T00:00:00Z"                                               │
└──────────────────────────────────────────┬───────────────────────────────────────────┘
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ 2. payload: compact JSON, in the order params declares                               │
│ {"token":"3fa85f64-5717-4562-b3fc-2c963f66afa6","expiration":"2026-01-01T00:00:00Z"} │
└─────────────┬────────────────────────────────────────────┬───────────────────────────┘
              ▼                                            ▼
┌──────────────────────────┐   ┌───────────────────────────────────────────────────────┐
│ 3. Base64 of the JSON    │   │ 4. HMAC-SHA256 of the JSON (not of the Base64),       │
│    = embed_request       │   │    keyed with api_key = "sk_test_embed_vector"        │
│                          │   │                                                       │
│ eyJ0b2tlbiI6IjNmYTg1…    │   │ 5. Base64 of the HMAC                                 │
│ …MDAwOjAwWiJ9            │   │    Us35rpnRp1AXfogcXlY+o/Ch7ZmoVrjcYdPcflylpwU=       │
│ (112 characters)         │   │                                                       │
│ No + / or =, so the      │   │ 6. percent-encoded in queryField hmac                 │
│ query writes it as is.   │   │    Us35rpnRp1AXfogcXlY%2Bo%2FCh7ZmoVrjcYdPcflylpwU%3D │
└─────────────┬────────────┘   └───────────────────────────┬───────────────────────────┘
              ▼                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ 7. URL: base URL + path + "?" + embed_request, then hmac last (wrapped)              │
│    https://api.example.com/v1/embed/widget                                           │
│    ?embed_request=eyJ0b2tlbiI6IjNmYTg1ZjY0LTU3MTctNDU2Mi1iM2Zj…MDAwOjAwWiJ9          │
│    &hmac=Us35rpnRp1AXfogcXlY%2Bo%2FCh7ZmoVrjcYdPcflylpwU%3D                          │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

The full values:

| Stage | Value |
| --- | --- |
| Payload, as compact JSON | `{"token":"3fa85f64-5717-4562-b3fc-2c963f66afa6","expiration":"2026-01-01T00:00:00Z"}` |
| `embed_request`: Base64 of the payload | `eyJ0b2tlbiI6IjNmYTg1ZjY0LTU3MTctNDU2Mi1iM2ZjLTJjOTYzZjY2YWZhNiIsImV4cGlyYXRpb24iOiIyMDI2LTAxLTAxVDAwOjAwOjAwWiJ9` |
| HMAC-SHA256 of the payload, in Base64 | `Us35rpnRp1AXfogcXlY+o/Ch7ZmoVrjcYdPcflylpwU=` |
| `hmac`, as the query writes it | `Us35rpnRp1AXfogcXlY%2Bo%2FCh7ZmoVrjcYdPcflylpwU%3D` |

The HMAC is computed over the JSON, not over its Base64. The server decodes `embed_request`, recomputes the HMAC of the JSON with the API key, compares it with `hmac` after percent-decoding the query, and checks `expiration`.

## Reference

[Signed URL methods](configuration/signed-urls.md) is the key-by-key reference: every key a `kind: signedUrl` method takes, its default, and each rule the config is checked against, when it loads or when the SDK is generated. It is generated from the config schema, so it always matches what the generator accepts. The keys are grouped as:

- [`signedUrl.source`](configuration/signed-urls.md#source): where the URL comes from, with [`sign`](configuration/signed-urls.md#sign) and its [`signature`](configuration/signed-urls.md#signature), [`request`](configuration/signed-urls.md#request) or [`method`](configuration/signed-urls.md#method);
- [`signedUrl.action`](configuration/signed-urls.md#action): what the method does with it;
- [`params`](configuration/signed-urls.md#params) and [`returns`](configuration/signed-urls.md#returns): the method's argument and result.

## More examples

### A CDN link with a client-option key

The [CDN image link](#a-cdn-image-link), with the key kept on the client instead, as a plain option the client never sends:

```json
{
  "clientSettings": {
    "opts": {
      "cdn_secret": { "type": "string", "readEnv": "ACME_CDN_SECRET", "description": "Key the CDN signs image links with." }
    }
  },
  "resources": {
    "images": {
      "methods": {
        "signed_thumbnail_url": {
          "kind": "signedUrl",
          "signedUrl": {
            "source": {
              "sign": {
                "endpoint": "get /images/{path}",
                "signature": {
                  "key": { "clientOption": "cdn_secret" },
                  "signatureBase": ["path", { "literal": "?" }, "query"],
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

```ts
const url = client.images.signedThumbnailURL({ path: 'cat.png', w: 400, expires: 1767225600 });
```

### A presigned download

The API answers `POST /v1/exports/{export_id}/download` with `{ "download_url": "https://…", "download_headers": { … } }`. The method asks for the link, then downloads it:

```json
"download": {
  "kind": "signedUrl",
  "returns": { "type": "string", "format": "binary" },
  "signedUrl": {
    "source": {
      "request": {
        "endpoint": "post /v1/exports/{export_id}/download",
        "urlField": "download_url",
        "headersField": "download_headers"
      }
    },
    "action": { "fetch": {} }
  }
}
```

```ts
const response = await client.exports.download('exp_123'); // a Response with the raw bytes
```

### An upload

These two methods generate the same SDK. `kind: signedUpload` is the simple preset for uploads; `kind: signedUrl` with a `request` source and the `upload` action is its general form.

```json
"upload": {
  "kind": "signedUpload",
  "endpoint": "post /files",
  "signedUpload": {
    "urlField": "upload_url",
    "headersField": "upload_headers",
    "confirm": { "endpoint": "post /files/{file_id}/complete", "pathParams": { "file_id": "id" } }
  }
}
```

```json
"upload": {
  "kind": "signedUrl",
  "signedUrl": {
    "source": {
      "request": { "endpoint": "post /files", "urlField": "upload_url", "headersField": "upload_headers" }
    },
    "action": {
      "upload": {
        "confirm": { "endpoint": "post /files/{file_id}/complete", "pathParams": { "file_id": "id" } }
      }
    }
  }
}
```

```ts
const stored = await client.files.upload(new File(['a,b\n'], 'report.csv'), {
  filename: 'report.csv',
  mime_type: 'text/csv',
  size: 4,
});
```

The method takes the first operation's path parameters, then the file, then its other parameters: here, the body `POST /files` requires.

## Security

- **The key never appears in the URL.** It is left out of the path, the query and the payload. A `{ "param": … }` field or a path placeholder that reads a `param` key is refused.
- **Build signed URLs server-side.** The URL carries no credential, but signing needs the key. Never ship the key to a browser.
- **Only a client option that stays on the client can sign.** An option the client sends as a header, a query, body or path parameter, or a server variable is refused as a key.

### What a fetch sends

The request carries only:

- the URL exactly as built or received;
- `Accept`, when `accept` is set;
- for a `request` source, the headers named by `headersField`;
- for a `sign` source, which points at your API, the `headers` of the call's own request options (a caller's `Accept` wins over `accept`, and a `null` removes a header), and, when the API description secures its operation, the client's auth headers and auth cookies.

It never carries the client's default headers, default query, `fetchOptions.headers`, or the SDK's own `User-Agent` and `X-Scalar-*` headers. A requested URL never carries the client's credentials or the call's headers. A signed URL's operation is secured when it declares security of its own, or inherits the document's default security; one that declares `security: []` is open, so its URL is its only credential. Only header and cookie credentials go: an API key sent in the query would change the URL that was signed. A secured fetch with no credential to send goes out without one, and the API answers as it would an unauthenticated call. A header the call sets is checked like a header a response names, stricter than on other calls: one the HTTP transport controls, such as `Accept-Encoding`, `Cookie` or `Transfer-Encoding`, or a value outside visible ASCII, is refused before any request. The platform still adds what it adds to every request, such as its own `User-Agent` and `Accept-Encoding`. The call's `query` and `body` are never sent, since the URL goes exactly as it was signed or received; its `signal`, `timeout`, `maxRetries` and `fetchOptions` apply.

A fetch method returns an `APIPromise`, like every other method: `await` it for the body, or call `.withResponse()` or `.asResponse()` for the host's `Response`.

A redirect is refused rather than followed (in a Dart SDK running on the web, the browser fails it instead, as a connection error the client retries; on the Dart VM and in Flutter apps it is refused), since following it could hand the URL and its headers to another host. A requested URL that answers with a redirect, such as a download link that sends the browser on to storage, fails with an SDK error; point `urlField` at the final URL instead.

A signed URL is built on the client's base URL, or on the server its operation declares (a Dart SDK always builds it on the client's base URL, since it reads no operation-level `servers` for any call), so it goes through the client's own HTTP function, as a call to that operation does. A requested URL points at another host, such as an object store, so it goes through the platform's HTTP function, not a custom one set on the client, which might add the API's credentials. Both use the client's timeout, retries and `fetchOptions` (minus `headers`, `body`, `method`, `redirect`, `credentials`, `referrer`, `referrerPolicy` and `mode`), so a proxy dispatcher applies to them too.

A retry resends the same URL. A signed URL with a short expiry can expire while the first attempt waits out its timeout, so give the default a lifetime longer than the client's timeout.

A requested URL must be `https:`, or plain `http:` only to `localhost`, `127.0.0.1` or `::1`, and must carry no user name or password.

### Redaction

The URL's query is kept out of every log line and error message, because it holds the signature or a presigned token. An error names the URL's origin and path, never the query. Only the query is treated as the credential: a host that puts its token in the path, as some CDNs do, has it shown in logs and errors.

### Errors from the URL's host

An error status from the URL's host throws the same error classes an API failure does (in Kotlin and Java, the same `…Exception` status classes, with `isSignedUrlHostError(e)` in the SDK's `core` package, `SignedUrl.isSignedUrlHostError(e)` from Java; in C#, the same `…ApiException` subclasses, with `SignedUrl.IsHostError(e)` in the SDK's `Core` namespace; in C++, the same `ApiError` subclasses, with `is_signed_url_host_error(error)` in `core/signed_url.hpp`; in Dart, the same `ApiException` subclasses, with `isSignedUrlHostError(error)` exported from the package library), so an expired or wrongly signed URL reads like a rejected API key (a 401 or 403). `isSignedURLHostError(error)`, exported from the package root, tells the two apart for a fetch that carries no API credential: the remedy is a fresh URL, which calling the method again signs or requests, not a new API key. A signed URL fetched with the client's credentials (its operation is secured) is a call to your API, so its errors are the API's own and `isSignedURLHostError` answers `false`: a 401 there may be the key.

```ts
import { isSignedURLHostError, PermissionDeniedError } from 'acme-sdk';

try {
  await client.widgets.getEmbedHTML({ token });
} catch (error) {
  if (!(error instanceof PermissionDeniedError && isSignedURLHostError(error))) throw error;
  // The link expired or its signature did not match: call the method again for a fresh one.
}
```

## What gets generated

| Source → action | TypeScript | Other targets |
| --- | --- | --- |
| `sign` → `return` | `getEmbedURL(params: WidgetGetEmbedURLParams): string` | Python: `get_embed_url(*, token: str, ...) -> str`, a plain `def` on the async client too; Go: `GetEmbedURL(ctx, params, opts...) (string, error)`, sending no request; Kotlin: `getEmbedUrl(params: WidgetGetEmbedUrlParams): String`, also on the async client; Java: `String getEmbedUrl(WidgetGetEmbedUrlParams params)`, likewise; Ruby: `get_embed_url(token:, …) -> String`; PHP: `getEmbedURL(string $token, ?string $css = null, …): string`; C#: `string GetEmbedUrl(WidgetGetEmbedUrlParams parameters)`, with no `WithRawResponse` twin; the CLI: `widgets get-embed-url --token <value>`, which prints the URL; C++: `std::string get_embed_url(const WidgetGetEmbedUrlParams& params) const`, also on the async client; others leave it out |
| `sign` → `fetch` | `getEmbedHTML(params: WidgetGetEmbedHTMLParams, options?: RequestOptions): APIPromise<string>` | Python: `get_embed_html(*, token: str, ..., extra_headers=None, timeout=not_given) -> str`; Go: `GetEmbedHTML(ctx, params, opts...) (string, error)`; Kotlin: `getEmbedHtml(params, requestOptions): String`, a `suspend fun` on the async client, and `HttpResponseFor<String>` on `withRawResponse()`; Java: the same, a `CompletableFuture<String>` on the async client; Ruby: `get_embed_html(token:, …, request_options: {}) -> String`; PHP: `getEmbedHTML(string $token, …, $requestOptions = null): string`, its raw twin returning `BaseResponse`; C#: `Task<string> GetEmbedHtml(WidgetGetEmbedHtmlParams parameters, CancellationToken cancellationToken = default)`, and `Task<HttpResponse<string>>` on `WithRawResponse`; the CLI: `widgets get-embed-html --token <value>`, which prints the body; C++: `std::string get_embed_html(const WidgetGetEmbedHtmlParams& params, const RequestOptions& options = {}) const`, a `std::future` on the async client; others leave it out |
| `request` → `fetch` | `download(exportID: string, options?: RequestOptions): APIPromise<Response>` | Python: `download(export_id: str, *, extra_headers=None, ...) -> BinaryAPIResponse`; Go: `Download(ctx, exportID, opts...) (*http.Response, error)`; Kotlin: `download(exportId, requestOptions): HttpResponse`, the live response; Java: the same, a `CompletableFuture<HttpResponse>` on the async client; Ruby: `download(export_id, request_options: {}) -> StringIO`; PHP: `download(string $exportID, $requestOptions = null): string`, its raw twin returning `BaseResponse` (`toFile()` for a large one); C#: `Task<HttpResponse> Download(string exportID, …)`, the live response; the CLI: `exports download <export-id> --output <path>`, which writes the bytes there or to a redirected standard output; C++: `BinaryResponse download(std::string_view export_id, const ExportDownloadParams& params = {}, const RequestOptions& options = {}) const`, the body unread; others leave it out |
| `request` → `upload` | `async upload(file: Uploadable, body: FileUploadParams, options?: RequestOptions): Promise<StoredFile>` | Python, Go, Java, Kotlin, Ruby, PHP and the CLI, as for `kind: signedUpload` |
| `request` → `return` | Left out | Left out |
| `sign` → `upload` | Left out | Left out |

A target that does not render a method's flow leaves the method out and reports [`Unsupported/SignedUrlMethod`](diagnostics.md). The generated TypeScript, Python, Go, Java, Kotlin, Ruby, PHP, C#, C++ and Dart READMEs gain a "Signed URLs" section when the SDK builds URLs locally or fetches one. In Python a fetch returns its body through the client's usual response handling, so `with_raw_response` and `with_streaming_response` reach the response, and `is_signed_url_host_error(error)` (exported from the package root) tells an error the URL's host raised from the API's own. A URL a response named is fetched with a plain `httpx` client: proxy and CA settings from the environment apply to it, but not the proxy or `verify` of a custom `http_client`. In Ruby, a fetch returns the body as the method's `returns` reads (a `String` for text, a `StringIO` for bytes, the decoded model for JSON), and an error from the URL's host is extended with `Errors::SignedURLHostError`, which `rescue` matches.

## What a `sign` source cannot express yet

A `sign` source covers a server that checks one HMAC-SHA256, keyed with the key's UTF-8 bytes, over the path, the query, a JSON payload and fixed text, written into a query field of its own. These schemes need more than that, so they cannot be configured today:

- **A signature in the path, or inside another field**, such as a token segment at the start of the path, or a field that joins an expiry and the signature (`verify=<expiry>-<signature>`).
- **A key that is not used as UTF-8 text**, such as a Base64- or hex-encoded key the server decodes first, or a key with a salt.
- **Another algorithm**: HMAC-SHA1, MD5, a plain SHA-256 of the key and the path, RSA, or a signed JWT.
- **A standard signing scheme**, such as [RFC 9246](https://www.rfc-editor.org/rfc/rfc9246) URI signing (a JWT in one query field) or [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421) HTTP message signatures (`Signature-Input` and `Signature` request headers, so only a `fetch` action could carry them). These would be added as other [`format`](configuration/signed-urls.md#format) values, so a config written today keeps working.
- **A string to sign built from individual values**, such as the expiry and the path joined by a newline. The parts are the whole path, the whole encoded query, the payload and literals.
- **AWS Signature Version 4**, which derives its key and hashes a canonical request.

An object store's presigned upload and download links work through a [`request` source](configuration/signed-urls.md#request): the API signs the URL, and the SDK only fetches it.

## Diagnostics

### When the config loads

A config that breaks one of these rules does not load. Each message follows the JSON pointer of the key it is about. A config handed straight to the compiler is held to the same rules, and the method is left out with `Config/InvalidSignedUrl`.

| At | Message | Fix |
| --- | --- | --- |
| `signedUrl` | is required on a `kind: signedUrl` method: add `"signedUrl": { "source": { … }, "action": … }` to say where the URL comes from and what the method does with it | Add the block. |
| `signedUrl/source/method` | names "x", which is no method: write a sibling method's key, or a dotted address read from the root of `resources` (resource keys as written, then the method key, as in `widgets.get_embed_url`) | Fix the name. |
| `signedUrl/source/method` | names "x", which is this method itself: name the method whose URL it takes | Name the other method. |
| `signedUrl/source/method` | names "widgets.embed", which is an endpoint method: only a `kind: signedUrl` method has a URL to take. Name a `kind: signedUrl` method, or write this method's `sign` or `request` source out | Name a signed URL method. |
| `signedUrl/source/method` | names "widgets.get_embed_html", which takes its URL from `source.method` too: name the method that writes the `sign` or `request` source instead | Name the method at the end of the chain. |
| `params` | must not be set with `signedUrl.source.method`, which takes the params of "widgets.get_embed_url" along with its URL: remove it, or write the `source` out in full to give this method params of its own | Remove `params`. |
| `params` | is not read with a `request` source, whose method takes the parameters of the operation that issues the URL: remove `params` | Remove `params`. |
| `params` | must be an object schema or a `$ref`, since it becomes the method's one params argument: `{ "type": "object", "properties": { … } }` or `{ "$ref": "#/components/schemas/Name" }` | Write an object schema. |
| `params` | is required when the URL carries a payload (`sign.payload`, a `{ "payload": … }` query field or a `"payload"` signature base part), which serializes the params in the order `params` declares them: declare them here | Write `params` out. |
| `signedUrl/action/upload/confirm` | needs a `request` source: its path is filled from the response that issued the URL, which a `sign` source has none of. Remove `confirm`, or get the URL from a `request` source | Remove `confirm`. |
| `returns` | must be a non-binary string schema with the `return` action, which hands back the URL; leave it out for `{ "type": "string", "format": "uri" }` | Remove `returns`. |
| `returns/async` | must be `false` with the `return` action, which makes no request: remove `async`, or set it to `false` | Remove `async`. |
| `returns` | is required with the `fetch` action, which returns the body: `{ "type": "string" }`, a JSON schema, or `{ "type": "string", "format": "binary" }` for the raw response | Add `returns`. |
| `returns` | names no type, which the `fetch` action needs to say what the body is: `{ "type": "string" }` for text, a JSON schema, or `{ "type": "string", "format": "binary" }` for the raw response | Name a type. |
| `returns/async` | must not be `false` with the `fetch` action, which sends a request: remove `async` | Remove `async`. |
| `signedUrl/action/fetch/accept` | must be a valid HTTP header value: visible ASCII, with spaces and tabs only between visible characters (`text/html`, `application/json; q=0.9`) | Fix the value. |
| `signedUrl/source/sign/query/<name>` | is a bare string; write the param it reads as `{ "param": "w" }` | Write the object form. A bare `"signature"` is answered with the `queryField` to set instead. |
| `signedUrl/source/sign/query/<name>` | is the field `signature.queryField` names, which the signature fills, always last: remove it from `query` | Remove the field. |
| `signedUrl/source/sign/signature/signatureBase/<n>` | unknown signature base part `querry`; expected `payload`, `path`, `query`, or `{ "literal": "…" }` (write fixed text such as `?` as `{ "literal": "?" }`) | Fix the token, or make it a literal. |
| `signedUrl/source/sign/signature/signatureBase/<n>/literal` | is empty, so it signs nothing: remove the part, or write the fixed text it stands for, such as `{ "literal": "?" }` | Remove the part. |
| `signedUrl/source/sign/defaults/<param>/now` | must be longer than zero, or the URL expires as it is made: write the lifetime you want, such as `PT1M` (one minute) | Use a positive duration. |
| `signedUrl/source/sign/defaults/<param>/now` | counts months, which vary in length, …; one minute is `PT1M`, with the `T` (also: years, lowercase, a fraction of a second) | Write weeks, days, hours, minutes and whole seconds. |
| `signedUrl/source/sign/signature/signatureBase` | signs only fixed text, so every URL would carry the same signature … | Add a `"path"`, `"query"` or `"payload"` part. |
| `signedUrl/source/method` | names "a.b.get_embed_url", which more than one method answers to, since a resource or method key holds a dot | Rename that key. |
| `returns` | is not read with the `upload` action, which returns the response that issued the URL, or the confirm step's | Remove `returns`. |
| `signedUrl/source/sign/signature/key/clientOption` | names "x", whose `defaultValue` would be written into the generated SDK for anyone who installs it to read | Remove the `defaultValue` and read the key from `readEnv`. |
| `signedUrl/source/sign/signature/key/param` | names "x", which `params.required` does not list, so a caller could leave the key out and no URL could be signed | Add it to `params.required`. |
| `signedUrl/source/sign/defaults/<param>` | fills `x`, which `params.required` lists, so a caller could never leave it out and the default would never apply | Remove it from `params.required`, or remove the default. |
| `signedUrl/source/sign/defaults/<param>/now` | must be at most 100 years (`P36525D`), the longest every SDK can add to the current time: write a shorter duration, such as `P30D` | Use a shorter duration. |
| any text in `signedUrl` or a `params` name | must be well-formed Unicode: it holds a lone surrogate, which has no UTF-8 spelling, so every SDK would write and sign it differently. Replace the escaped surrogate (`\ud800`) with the character you meant | Fix the text. |
| `returns/native/<target>` | "List<String>" is not a type name java can use: write a qualified name in java's own spelling, with no generic arguments, arrays or whitespace | Use a plain type name. |

The schema also refuses a wrong type or an unknown key at its pointer, such as two sources, a `post` sign endpoint, a `signature` with no `queryField`, or an unknown encoding.

### When the SDK is generated

These need the API description, so they are reported as `Config/InvalidSignedUrl` (an error), and the method is left out of every SDK. The message reads `Signed-URL method "<resource>.<method>" is not generated: <reason>.` Where `params` is left out, a reason names the params as the endpoint's path and query parameters instead of `params`.

| Reason | Fix |
| --- | --- |
| its `signedUrl.source.sign.endpoint` (or `source.request.endpoint`) "…" has no matching operation in the OpenAPI document | Point it at an operation the document declares. |
| its endpoint "…" pins a query in its path, which a signed URL cannot sign the same way in every SDK | Declare the field as a query parameter of the operation in the OpenAPI document. |
| `signedUrl.source.sign.signature.queryField` "x" is not a query parameter of "…" | Declare the parameter, or fix the name. |
| the path placeholder `x` of "…" has no matching property in `params` | Add the property. |
| the path placeholder `x` of "…" is filled from a property `params.required` does not list | List it as required. |
| the path placeholder `x` of "…" is filled from a property that is not a string, integer or boolean | Change its type. |
| `signedUrl.source.sign.query.x` is not a query parameter of "…" | Use a declared query parameter. |
| `signedUrl.source.sign.query.x` reads the param `y`, which is not a property of `params` | Add the property, or fix the name. |
| the query field `x` reads the param `x`, which is not a string, integer or boolean | Change its type, or write `query` without it. |
| "…" requires the query parameter `x`, which `signedUrl.source.sign.query` does not fill | Add a field for it. |
| "…" requires the query parameter `x`, which nothing fills: `params` declare no property of that name | Declare the property, or write `query` to fill it with a literal or the payload. |
| "…" requires the header parameter `x`, which a signed URL cannot carry | Sign another endpoint: a browser sends no such header. |
| `signedUrl.source.sign.query.x` reads the param `k`, the signing key, which must never appear in the URL | Remove the field. |
| the path of "…" is filled from `k`, the signing key, which must never appear in the URL | Pass the key in another param. |
| `params.properties.x` is serialized into the payload, so it must be a string, integer or boolean | Change its type. |
| `signedUrl.source.sign.defaults.x` names no property of `params` | Fix the name. |
| `signedUrl.source.sign.defaults.x` fills a time, so `params.properties.x` must be a `date-time` string or an integer (Unix seconds, with no `format` or `int64` or `unix-time`) | Change the property's type or format. |
| `signedUrl.source.sign.defaults.x` fills a Unix time, but `params.properties.x` has a `maximum` of N, below any current Unix time | Remove the default: the param holds something else. |
| `signedUrl.source.sign.defaults.x` fills `x`, which the URL never carries | Add a query field for it, or carry the payload in a `{ "payload": … }` field. |
| the `required` list of a `$ref`'d `params` schema lists `x`, which `signedUrl.source.sign.defaults.x` fills | Remove `x` from that list, or remove the default. |
| `signedUrl.source.sign.defaults.x` fills `x`, which `signedUrl.source.sign.signature.signatureBase` does not sign | Sign it with a `"query"`, `"payload"` or `"path"` part. |
| `signedUrl.source.sign.signature.signatureBase` signs nothing that varies from one URL to the next | Sign the path (with a placeholder), the query (with a field that reads a param) or the payload. |
| `signedUrl.source.sign.signature.signatureBase` signs the payload, which serializes `x`, but no query field carries the payload or `x` | Add a `{ "payload": … }` field to `query`. |
| "…" declares `x` as both a path and a query parameter, so no params model can be derived from it | Write `params`. |
| `signedUrl.source.sign.signature.key.clientOption` names "x", which is not a `clientSettings.opts` entry | Declare the option. |
| `signedUrl.source.sign.signature.key.clientOption` names "x", which is not a string option | Make it a string option. |
| `signedUrl.source.sign.signature.key.clientOption` names "x", which sets `sendInHeader`, so the client would send it; … | Use a plain option, or the scheme's one credential. |
| `signedUrl.source.sign.signature.key.param` names "x", which is not a string property of `params` | Add a string property. |
| `signedUrl.source.sign.signature.key.param` names "x", which the `required` list of a `$ref`'d `params` schema does not list | Add it to that list. |
| the response field `x` of "…" is an integer, not the URL string the method reads (or, for `headersField`, not the map of header names to values, such as a map of arrays) | Point `urlField` at a string field, `headersField` at an object of strings. |
| its `params` do not resolve to an object schema | Point the `$ref` at an object schema. |
| its `signedUrl.source.method` names "…", which is not generated | Fix the named method; its own report says why. |

A `request` source with the `upload` action is checked like `kind: signedUpload`, and its reasons name the `signedUrl` keys. A target that does not render a method's flow reports `Unsupported/SignedUrlMethod` (a warning) and leaves the method out of that SDK only.

See [Diagnostics](diagnostics.md) for how findings are graded, suppressed, and used to fail a build.

## Related

- [Configuration](configuration.md) — `resources`, methods, and the `clientSettings.opts` entry that holds a key
- [Diagnostics](diagnostics.md) — `Config/InvalidSignedUrl` and `Unsupported/SignedUrlMethod`
- [Webhooks](webhooks.md) — the other side of signing: verifying what your API sends
