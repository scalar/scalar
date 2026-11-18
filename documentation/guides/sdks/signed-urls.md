# Signed URLs

<scalar-callout type="warning" icon="phosphor/regular/warning">
  Signed URL methods are experimental. The config shape may change in a later release, before it is stable. Every target renders them today, uploads included.
</scalar-callout>

A `kind: signedUrl` method generates an SDK method that gets a signed URL and does one thing with it: returns it, downloads it, or uploads a file to it. This page explains what a signed URL is and how one is checked, then how to configure the method. The [configuration reference](#configuration-reference) at the end lists every key.

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
| **`sign`**: build and sign the URL locally | Returns the URL as a string. No request, so the method is synchronous. Every target. | Builds the URL, sends a `GET` to it and returns the body. Every target. | Not rendered by any target: there is no API response to upload against. |
| **`request`**: read the URL from an API response | Not rendered by any target yet. | Calls the operation, then sends a `GET` to the URL without the API key and returns the body. Every target. | Calls the operation, sends the file to the URL without the API key, then optionally confirms. Every target. This is `kind: signedUpload`. |

A combination no target renders still loads, but the method is left out of every SDK and reported as `Unsupported/SignedUrlMethod`. The exception is a `sign` source with an upload `confirm`, which fails to load.

A third source, [`source.method`](#signedurlsourcemethod), takes the URL from another `kind: signedUrl` method, so one URL can be both returned and fetched without writing its signing twice.

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
| `source.sign.defaults` | A caller who leaves out `expiration` gets the time one minute from now. Add `"skip": ["go"]` to the entry to leave the default out of the Go SDK, where the URL then carries no expiry unless the caller passes one. |
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

In TypeScript, a fetch method returns an `APIPromise`, like every other method: `await` it for the body, or call `.withResponse()` or `.asResponse()` for the host's `Response`.

A redirect is refused rather than followed (in a Dart SDK running on the web, the browser fails it instead, as a connection error the client retries; on the Dart VM and in Flutter apps it is refused), since following it could hand the URL and its headers to another host. A Go SDK given an `option.WithHTTPClient` that is not an `*http.Client` cannot stop that client following a redirect for a signed URL, only refuse the answer it ends at, so such a client must not follow redirects for these fetches. A requested URL that answers with a redirect, such as a download link that sends the browser on to storage, fails with an SDK error; point `urlField` at the final URL instead.

A signed URL is built on the client's base URL, or on the server its operation declares (a Dart SDK always builds it on the client's base URL, since it reads no operation-level `servers` for any call), so it goes through the client's own HTTP function, as a call to that operation does. A requested URL points at another host, such as an object store, so it goes through the platform's HTTP function, not a custom one set on the client, which might add the API's credentials. Both use the client's timeout, retries and `fetchOptions` (minus `headers`, `body`, `method`, `redirect`, `credentials`, `referrer`, `referrerPolicy` and `mode`), so a proxy dispatcher applies to them too. A Swift SDK fetches a requested URL over a plain `URLSession` of its own, never `Configuration.transport` or its session, so neither a proxy nor a delegate configured there applies to it; the client's timeout applies as an idle timeout, and its retries as on every call. A C# SDK fetches a requested URL over an `HttpClient` of its own, with the platform's default proxy and TLS settings rather than those of a caller-supplied `HttpClient`; a PHP SDK sends it through PHP's HTTP stream wrapper, so it needs `allow_url_fopen`; and a Rust SDK sends it through a reqwest client of its own, so it needs the crate's default `reqwest` feature.

A retry resends the same URL. A signed URL with a short expiry can expire while the first attempt waits out its timeout, so give the default a lifetime longer than the client's timeout.

A requested URL must be `https:`, or plain `http:` only to `localhost`, `127.0.0.1` or `::1`, and must carry no user name or password.

### Redaction

The URL's query is kept out of every log line and error message, because it holds the signature or a presigned token. An error names the URL's origin and path, never the query. Only the query is treated as the credential: a host that puts its token in the path, as some CDNs do, has it shown in logs and errors.

### Errors from the URL's host

An error status from the URL's host throws the same error classes an API failure does (in Kotlin and Java, the same `…Exception` status classes, with `isSignedUrlHostError(e)` in the SDK's `core` package, `SignedUrl.isSignedUrlHostError(e)` from Java; in C#, the same `…ApiException` subclasses, with `SignedUrl.IsHostError(e)` in the SDK's `Core` namespace; in C++, the same `ApiError` subclasses, with `is_signed_url_host_error(error)` in `core/signed_url.hpp`; in Dart, the same `ApiException` subclasses, with `isSignedUrlHostError(error)` exported from the package library; in Swift, `APIError`, with the `isSignedURLHostError` property on it and on `ClientError`; in Rust, the same `Error::Api`, with `Error::is_signed_url_host_error`; in Go, the same `*Error`, with `errors.Is(err, ErrSignedURLHost)`; in PHP, the same exception classes, with `Core\Implementation\SignedURLRequester::isHostError($e)`), so an expired or wrongly signed URL reads like a rejected API key (a 401 or 403). `isSignedURLHostError(error)`, exported from the package root, tells the two apart for a fetch that carries no API credential: the remedy is a fresh URL, which calling the method again signs or requests, not a new API key. A signed URL fetched with the client's credentials (its operation is secured) is a call to your API, so its errors are the API's own and `isSignedURLHostError` answers `false`: a 401 there may be the key. The CLI reports a 401 or 403 from the URL's host as `client-error`, not `auth-failed`, with a hint to run the command again for a fresh URL.

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
| `sign` → `return` | `getEmbedURL(params: WidgetGetEmbedURLParams): string` | Python: `get_embed_url(*, token: str, ...) -> str`, a plain `def` on the async client too; Go: `GetEmbedURL(ctx, params, opts...) (string, error)`, sending no request; Kotlin: `getEmbedUrl(params: WidgetGetEmbedUrlParams): String`, also on the async client; Java: `String getEmbedUrl(WidgetGetEmbedUrlParams params)`, likewise; Ruby: `get_embed_url(token:, …) -> String`; PHP: `getEmbedURL(string $token, ?string $css = null, …): string`; C#: `string GetEmbedUrl(WidgetGetEmbedUrlParams parameters)`, with no `WithRawResponse` twin; Rust: `get_embed_url(&self, params: &WidgetsGetEmbedUrlParams) -> Result<String, Error>`; the CLI: `widgets get-embed-url --token <value>`, which prints the URL; C++: `std::string get_embed_url(const WidgetGetEmbedUrlParams& params) const`, also on the async client; Swift: `getEmbedURL(token:css:expiration:targetOrigin:) throws -> String`, and `getEmbedURL(params: WidgetsResource.GetEmbedURLParams)`, throwing `ClientError` when its key is a `Credential(provider:)`, which answers asynchronously; Dart: `String getEmbedUrl({required String token, String? css, DateTime? expiration, String? targetOrigin})`, sending no request |
| `sign` → `fetch` | `getEmbedHTML(params: WidgetGetEmbedHTMLParams, options?: RequestOptions): APIPromise<string>` | Python: `get_embed_html(*, token: str, ..., extra_headers=None, timeout=not_given) -> str`; Go: `GetEmbedHTML(ctx, params, opts...) (string, error)`; Kotlin: `getEmbedHtml(params, requestOptions): String`, a `suspend fun` on the async client, and `HttpResponseFor<String>` on `withRawResponse()`; Java: the same, a `CompletableFuture<String>` on the async client; Ruby: `get_embed_html(token:, …, request_options: {}) -> String`; PHP: `getEmbedHTML(string $token, …, $requestOptions = null): string`, its raw twin returning `BaseResponse`; C#: `Task<string> GetEmbedHtml(WidgetGetEmbedHtmlParams parameters, CancellationToken cancellationToken = default)`, and `Task<HttpResponse<string>>` on `WithRawResponse`; Rust: `get_embed_html(params)`, a request builder whose `send().await` returns `Result<String, Error>`; the CLI: `widgets get-embed-html --token <value>`, which prints the body; C++: `std::string get_embed_html(const WidgetGetEmbedHtmlParams& params, const RequestOptions& options = {}) const`, a `std::future` on the async client; Swift: `getEmbedHTML(token:css:expiration:targetOrigin:options:) async throws -> String` (and a `params:` overload), its response on a `ResponseRecorder`; Dart: `Future<String> getEmbedHtml({required String token, …, RequestOptions? requestOptions})`, and `Future<ApiResponse<String>>` on `withRawResponse` |
| `request` → `fetch` | `download(exportID: string, options?: RequestOptions): APIPromise<Response>` | Python: `download(export_id: str, *, extra_headers=None, ...) -> BinaryAPIResponse`; Go: `Download(ctx, exportID, opts...) (*http.Response, error)`; Kotlin: `download(exportId, requestOptions): HttpResponse`, the live response; Java: the same, a `CompletableFuture<HttpResponse>` on the async client; Ruby: `download(export_id, request_options: {}) -> StringIO`; PHP: `download(string $exportID, $requestOptions = null): string`, its raw twin returning `BaseResponse` (`toFile()` for a large one); C#: `Task<HttpResponse> Download(string exportID, …)`, the live response; Rust: `download(export_id)`, a request builder whose `send().await` returns the unread `http::Response<SdkBody>`; the CLI: `exports download <export-id> --output <path>`, which writes the bytes there or to a redirected standard output; C++: `BinaryResponse download(std::string_view export_id, const ExportDownloadParams& params = {}, const RequestOptions& options = {}) const`, the body unread; Swift: `download(_ exportID: String, options: RequestOptions = RequestOptions()) async throws -> Data`; Dart: `Future<Uint8List> download(String exportId, {RequestOptions? requestOptions})`, the whole body buffered with no size limit, and `Future<StreamingApiResponse<List<int>>>` on `withRawResponse`, which streams it |
| `request` → `upload` | `async upload(file: Uploadable, body: FileUploadParams, options?: RequestOptions): Promise<StoredFile>` | Python, Go, Java, Kotlin, Ruby, PHP and the CLI, as for `kind: signedUpload`; C#: `Task<StoredFile> Upload(BinaryContent file, FileUploadParams parameters, CancellationToken cancellationToken = default)`, and the confirm's `HttpResponse<StoredFile>` on `WithRawResponse`; C++: `StoredFile upload(const FileUpload& file, const FileUploadParams& params, const RequestOptions& options = {}) const`, a `std::future` on the async client; Dart: `Future<StoredFile> upload(UploadFile file, {required String filename, …, RequestOptions? requestOptions})`, and `Future<ApiResponse<StoredFile>>` on `withRawResponse`; Swift: `upload(file: FilePart, filename:mimeType:size:options:) async throws -> StoredFile` (and a `params:` overload); Rust: `upload(file: impl Into<UploadFile>, body: CreateUploadRequest)`, a request builder whose `send().await` returns `Result<StoredFile, Error>` |
| `request` → `return` | Left out | Left out |
| `sign` → `upload` | Left out | Left out |

A target that does not render a method's flow leaves the method out and reports [`Unsupported/SignedUrlMethod`](diagnostics.md), or `Unsupported/SignedUploadMethod` for an upload. Every target's generated README gains a "Signed URLs" section when the SDK builds URLs locally or fetches one. In Python a fetch returns its body through the client's usual response handling, so `with_raw_response` and `with_streaming_response` reach the response, and `is_signed_url_host_error(error)` (exported from the package root) tells an error the URL's host raised from the API's own. A URL a response named is fetched with a plain `httpx` client: proxy and CA settings from the environment apply to it, but not the proxy or `verify` of a custom `http_client`. In Ruby, a fetch returns the body as the method's `returns` reads (a `String` for text, a `StringIO` for bytes, the decoded model for JSON), and an error from the URL's host is extended with `Errors::SignedURLHostError`, which `rescue` matches. In Go, a fetch returns the body as the method's `returns` reads (a `string` for text, the unread `*http.Response` for bytes, the decoded model for JSON), or as `[]byte` or `string` whatever its schema when `returns.native.go` names one, and `option.WithResponseInto` and `option.WithResponseBodyInto` work on it as on any other method: the first gets the fetched response (the failed one's, its request stripped of the URL's query, when the host answers with an error), and a destination given to the second takes the body in place of the method's result.

## What a `sign` source cannot express yet

A `sign` source covers a server that checks one HMAC-SHA256, keyed with the key's UTF-8 bytes, over the path, the query, a JSON payload and fixed text, written into a query field of its own. These schemes need more than that, so they cannot be configured today:

- **A signature in the path, or inside another field**, such as a token segment at the start of the path, or a field that joins an expiry and the signature (`verify=<expiry>-<signature>`).
- **A key that is not used as UTF-8 text**, such as a Base64- or hex-encoded key the server decodes first, or a key with a salt.
- **Another algorithm**: HMAC-SHA1, MD5, a plain SHA-256 of the key and the path, RSA, or a signed JWT.
- **A standard signing scheme**, such as [RFC 9246](https://www.rfc-editor.org/rfc/rfc9246) URI signing (a JWT in one query field) or [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421) HTTP message signatures (`Signature-Input` and `Signature` request headers, so only a `fetch` action could carry them). These would be added as other [`format`](#format) values, so a config written today keeps working.
- **A string to sign built from individual values**, such as the expiry and the path joined by a newline. The parts are the whole path, the whole encoded query, the payload and literals.
- **AWS Signature Version 4**, which derives its key and hashes a canonical request.

An object store's presigned upload and download links work through a [`request` source](#signedurlsourcerequest): the API signs the URL, and the SDK only fetches it.

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
| `signedUrl.source.sign.defaults.x.skip` lists targets that would leave `x` unfilled, but it fills a path placeholder (or the query parameter `x`, which "…" requires), so those targets could build no valid URL | Remove `skip`, or default a param the caller may leave out. |
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

A `request` source with the `upload` action is checked like `kind: signedUpload`, and its reasons name the `signedUrl` keys. A target that does not render a method's flow reports `Unsupported/SignedUrlMethod` (a warning), or `Unsupported/SignedUploadMethod` for an upload, and leaves the method out of that SDK only.

See [Diagnostics](diagnostics.md) for how findings are graded, suppressed, and used to fail a build.

## Configuration reference

Every key a `kind: signedUrl` method takes, its default, and each rule the config is checked against, when it loads or when the SDK is generated. It is generated from the config schema, so it always matches what the generator accepts. The method is declared under `resources`, like any other method, and its keys are grouped as:

- `signedUrl.source`: where the URL comes from, with exactly one of [`sign`](#signedurlsourcesign) and its [`signature`](#signature), [`request`](#signedurlsourcerequest) or [`method`](#signedurlsourcemethod);
- [`signedUrl.action`](#signedurlaction): what the method does with it;
- [`params`](#params) and [`returns`](#returns): the method's argument and result.

<!-- config-reference:start -->
<!-- Rendered from the config schema up to config-reference:end. Edit the schema descriptions, not this section: every regeneration rewrites it. -->

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

**`signedUrl`** (required with `kind: signedUrl`): For `kind: signedUrl` methods, which are generated from config: the API description has no operation for them. A signed URL is a link that carries its own permission: the server checks a signature or token in the URL instead of a credential, so whoever holds the link can use it until it expires, without an API key. Use one to let a browser, an `<iframe>` or a CDN load something, or to download from or upload to an object store the API hands out links for. `source` says where the URL comes from: `sign` builds and signs it in the SDK with a shared secret (an embed link, a CDN image link), `request` asks an API operation for it (a presigned download or upload link), and `method` gets it exactly as another `kind: signedUrl` method does. `action` says what the method does with it: `"return"` hands the URL back without a request, `{ "fetch": {} }` downloads it, and `{ "upload": {} }` sends a file to it. `kind: signedUpload` is the simple preset for uploads: it is a `request` source with the `upload` action and generates the same SDK. A target that does not render a method's flow leaves the method out and reports `Unsupported/SignedUrlMethod`; a configuration the API description cannot honour leaves it out everywhere and reports `Config/InvalidSignedUrl`. Example: `{ "source": { "method": "get_embed_url" }, "action": { "fetch": { "accept": "text/html" } } }`.

**`signedUrl.source`** (required): Where the URL comes from: exactly one of `sign` (the SDK builds and signs it), `request` (an operation's response holds it) or `method` (another `kind: signedUrl` method's URL). Example: `{ "request": { "endpoint": "post /v1/exports/{export_id}/download", "urlField": "download_url" } }`.

### signedUrl.source.sign

**Type:** `object`

Builds the URL of a `get` operation in the SDK and, with a `signature`, signs it with a shared secret, the way a CDN or an embed endpoint expects. The params and query fields default to the operation's own parameters. No request is made to build it, so a `return` method is synchronous. Use it when the API documents how its URLs are signed and the SDK can hold the secret. Example: `{ "endpoint": "get /images/{path}", "signature": { "key": { "param": "signing_key" }, "signatureBase": ["path", { "literal": "?" }, "query"], "encoding": "hex", "queryField": "signature" } }`.

#### endpoint

**Type:** `string`

**Required**

The `get` operation whose URL is built, as `"get <path>"`. Only `get`: a signed URL is opened by a browser, an `<iframe>` or a CDN, which all send a plain `GET`. Each path placeholder is filled from the param of the same name, which must be required (or filled by `defaults`), percent-encoded as a path segment. A path that pins a query (`/files/{id}?download=true`) is refused: declare the field as a query parameter instead. So is an operation that requires a header or cookie parameter, other than the header a security scheme's credential goes in, since a browser opening the link sends neither. Its path and query parameters are the method's params when `params` is left out, and its query parameters are the URL's query fields when `query` is left out. The URL is the client's base URL, then the path, then `?` and the query. The operation is still generated as an ordinary method if a resource places it. Example: `"get /images/{path}"`.

**Constraints:** `pattern: ^get .+$`

#### payload

**Type:** `"json"`

Serializes the params into one value, the payload, which a `{ "payload": "<encoding>" }` query field carries and a `"payload"` signature base part signs. Optional: it defaults to `json` when a query field or the signature base reads the payload, and to none otherwise; `json` is the only value. A payload needs `params` written out, since it serializes them in the order `params` declares them. `json` writes the params as compact UTF-8 JSON: properties in the order `params` declares them (never the caller's order), absent ones left out rather than written as `null`, no whitespace, non-ASCII as UTF-8 rather than `\u` escapes, and a `param` signing key left out. A `date-time` string is written as given; a native date as UTC `YYYY-MM-DDTHH:MM:SSZ`, without fractional seconds. Example: `{ "token": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "expiration": "2026-01-01T00:00:00Z" }` serializes to `{"token":"3fa85f64-5717-4562-b3fc-2c963f66afa6","expiration":"2026-01-01T00:00:00Z"}`.

#### signature

**Type:** `object`

How the URL is signed. With `format` `hmac`, the default and only scheme so far: an HMAC of the `signatureBase` bytes under `key`, written as `encoding` into the query field `queryField` names, after every other field. Leave it out for a URL that carries no signature. Example: `{ "key": { "param": "signing_key" }, "signatureBase": ["path", { "literal": "?" }, "query"], "encoding": "hex", "queryField": "signature" }`.

##### format

**Type:** `"hmac"`

The signing scheme, which decides the rest of the block's keys. Optional: `hmac`, the default and only value so far, is an HMAC of the `signatureBase` bytes under `key`, written as `encoding` into the query field `queryField` names. It fits a server that dictates its own signing rules, such as a CDN or an embed endpoint. Standard schemes may be added as other values later; a block that leaves `format` out keeps meaning `hmac`. Example: `"hmac"`.

##### algorithm

**Type:** `"hmac-sha256"`

The MAC algorithm. Optional: `hmac-sha256`, the default and only value, computes HMAC-SHA256 keyed with the key's UTF-8 bytes over the signature base. Example: `"hmac-sha256"`.

##### key

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

##### signatureBase

**Type:** `(string | object)[]`

**Required**

The signature base: the parts joined, in order, into the bytes the HMAC is computed over (RFC 9421's term, <https://www.rfc-editor.org/rfc/rfc9421#name-creating-the-signature-base>; AWS, Google Cloud Storage and Azure call it the string to sign). A part is a token or a literal. `"payload"` is the serialized payload. `"path"` is the path as it appears in the URL, percent-encoded, without the base URL's own path prefix: `/images/cat.png` even when the base URL is `https://cdn.example.com/v2`. `"query"` is the query as encoded in the URL, every field except the `queryField` one, without the leading `?`: `w=400&expires=1767225600`. `{ "literal": "?" }` is fixed text, signed as written. Literals are objects so that a mistyped token (`"querry"`) fails when the config loads instead of being signed as text, which would only show up as every URL being rejected. Nothing separates the parts, so put a literal delimiter between two that vary; without one, two different URLs can join to the same bytes and share a signature: with `["path", "query"]`, the path `/images/a` with the query `w=1` and the path `/images/aw=1` with no query both sign `/images/aw=1`. Two rules keep a signature checkable, and a method that breaks either is not generated. Something varies: at least one part must change from one URL to the next (a `"path"` with a placeholder, a `"query"` with a field that reads a param or the payload, or a `"payload"` with properties), or the signature would work as one reusable token for every URL. What is signed is sent: the server rebuilds the signature base from the request it receives, so a `"payload"` part needs the payload in a `{ "payload": … }` query field, or every param it serializes sent as a query field or a path placeholder. Example: `["path", { "literal": "?" }, "query"]` signs `/images/cat.png?w=400&expires=1767225600`.

**Constraints:** `minItems: 1`

###### literal

**Type:** `string`

**Required**

Fixed text signed as written, such as `?`, `\n` or a version prefix. It must not be empty. Example: `"?"`.

##### encoding

**Type:** `"base64" | "base64url" | "hex"`

**Required**

How the signature bytes are written into the URL, which must match what the server compares against. `hex` is lowercase hexadecimal, 64 characters for HMAC-SHA256. `base64` is standard Base64 with `+`, `/` and `=` padding, which the query percent-encodes (`%2B`, `%2F`, `%3D`), so the server must decode the query before comparing. `base64url` uses `-` and `_` and drops the padding, so it travels unescaped. Example: `"hex"`.

##### queryField

**Type:** `string`

**Required**

The query parameter of `endpoint` that carries the signature, by wire name. It must be a query parameter the API description declares. It is written after every other field, is never part of the `"query"` signature base part, and is not one of the method's params when `params` is left out. Do not list it in `query`. Example: `"signature"`, or `"hmac"` for an embed link.

**Constraints:** `minLength: 1`

#### query

**Type:** `Record<string, object>`

The URL's query fields, keyed by wire name, in the order the URL writes them, to override the default. Optional: left out, the URL writes every query parameter of `endpoint` in the order the API description declares them, each filled from the param of the same name and left out when the caller leaves it out or passes `null`; the `signature.queryField` one carries the signature. Write `query` when the server expects another order, or for a field filled from the payload or with fixed text. Then each key must be a query parameter of `endpoint`, every required one but the signature's must be listed, and the signature's field must not be: it is always written last. Only the listed fields are written, in the order listed. A value is `{ "param": "<name>" }`, `{ "payload": "base64" | "base64url" | "hex" }` or `{ "literal": "<text>" }`; a bare string fails to load. Names and values are percent-encoded the same way in every SDK: RFC 3986 unreserved characters (`A`–`Z`, `a`–`z`, `0`–`9`, `-`, `.`, `_`, `~`) stay, and every other UTF-8 byte becomes uppercase `%XX` (a space is `%20`, never `+`). Examples: `{ "embed_request": { "payload": "base64" } }` with `signature.queryField` `"hmac"` writes `?embed_request=eyJ0…&hmac=Us35…`; `{ "expires": { "param": "expires" }, "w": { "param": "w" } }` suits a server that signs `expires` first.

##### param

**Type:** `string`

The param whose value the field carries, by name. It must be a string, integer or boolean param, and never the signing key. The field is left out when the caller leaves the param out or passes `null`. Example: `"w"`.

**Constraints:** `minLength: 1`

##### payload

**Type:** `"base64" | "base64url" | "hex"`

How the payload is encoded into the field: `base64` (standard, padded), `base64url` (no padding) or `hex` (lowercase). Example: `"base64"`.

##### literal

**Type:** `string`

The value the field always carries, in every URL, percent-encoded and signed like any other field. Example: `"1"`.

#### defaults

**Type:** `Record<string, object>`

Values filled in when the caller leaves a param out, keyed by the param's name; usually an expiry. `{ "now": "<duration>" }` is the current UTC time plus an ISO 8601 duration, written in the param's format: a `date-time` string param gets an RFC 3339 time (`2026-01-01T00:01:00Z`), and an integer param with no `format`, `int64` or `unix-time` gets Unix seconds (`1767225660`). No other param takes a default: an `int32` integer overflows in 2038, another `format` such as `unix-time-ms` counts a different unit, and an integer whose `maximum` is below any current Unix time holds something else, such as a lifetime in seconds. Defaults apply to a copy of the caller's params, and a param that has one is optional in the method's params. A defaulted param must be sent: read by a query field, held by a path placeholder, or serialized into a payload a query field carries. When the URL is signed it must be signed too (read by a query field the `"query"` part signs, serialized into a signed `"payload"`, or a placeholder of a signed `"path"`), since an expiry that is sent but not signed could be pushed out by anyone holding the URL; a method that breaks either rule is not generated. A JSON Schema `default` in `params` is never filled in, since it can hold only a fixed value; a time relative to the call goes here. A default's `skip` leaves it out of the targets it names. Example: `{ "expiration": { "now": "PT1M" } }` makes the link expire one minute after it is built, and `{ "expiration": { "now": "PT1M", "skip": ["go"] } }` does so everywhere but Go.

##### now

**Type:** `string`

**Required**

An ISO 8601 duration added to the current UTC time: `PT1M` (one minute), `PT15M`, `P1D`, `P1DT12H`. Weeks, days, hours, minutes and whole seconds only: years and months vary in length, and every SDK must add the same number of seconds, so `P1M` (one month) is refused, and one minute is `PT1M`. A fraction of a second is refused too, since a signed time is written to the whole second. It must be longer than zero (`PT0S` would expire as it is made) and at most 100 years (`P36525D`), the furthest every SDK can count. Example: `"PT1M"`.

**Constraints:** `pattern: ^P(?=\d|T\d)(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$`

##### skip

**Type:** `("typescript" | "python" | "go" | "rust" | "java" | "kotlin" | "swift" | "ruby" | "cli" | "php" | "csharp" | "cpp" | "dart")[]`

Targets that leave this default out: there a caller who leaves the param out sends none, so a time param such as an expiry is not filled and the URL carries no expiry of its own. Every other target fills it. The param stays optional in every target, so a default that lists `skip` must fill a param the caller may already leave out: not a path placeholder, and not one a query field writes into a query parameter the API description requires; either one fails generation with `Config/InvalidSignedUrl`, since a target that skips the default would build a URL without it. Example: `["go", "java", "kotlin"]`.

### signedUrl.source.request

**Type:** `object`

Calls the operation at `endpoint`, whose response holds the URL, such as an object store's presigned download or upload link. The method takes that operation's parameters. These are the keys and rules of `kind: signedUpload`'s first step. Example: `{ "endpoint": "post /v1/exports/{export_id}/download", "urlField": "download_url" }`.

#### endpoint

**Type:** `string`

**Required**

The operation that answers with the URL, as `"<verb> <path>"`. The method takes its parameters the way a generated method for it would (see `initiateParams`). Example: `"post /v1/exports/{export_id}/download"`.

**Constraints:** `pattern: ^(delete|get|head|options|patch|post|put|trace) .+$`

#### urlField

**Type:** `string`

**Required**

Where the URL is in that operation's response, as a dot-separated path of wire names. When the response schema types the field, it must be a string. The URL must be `https:` (plain `http:` only to `localhost`, `127.0.0.1` or `::1`) and carry no user name or password. Example: `"download_url"`, or `"data.link.url"` for a nested one.

**Constraints:** `minLength: 1`

#### headersField

**Type:** `string`

Where that response holds a string map of headers the request to the URL must carry, such as a content type the link was signed for, as a dot-separated path of wire names. When the response schema types the field, it must be an object whose values are strings. The client's credentials and default headers never reach the URL's host: a `fetch` sends only these and `Accept`, and an `upload` only these and `Content-Type`. With the `fetch` action, a header the HTTP transport controls (`Host`, `Content-Length`, `Cookie`, any `Proxy-*` or `Sec-*`), or one whose value is not a string, is refused before any request. Example: `"download_headers"`.

**Constraints:** `minLength: 1`

#### initiateParams

**Type:** `"all" | "path"`

Which of the operation's parameters the method takes: `all` (default), or only its `path` parameters for an operation that needs nothing else, which is then sent with no body, query, header or cookie parameters, so it must require none. Example: `"path"`.

### signedUrl.source.method

**Type:** `string`

Gets the URL exactly as another `kind: signedUrl` method does, so two methods that build or request the same URL write it once. This method takes that method's whole `source`, including its `defaults`, and its `params`; it writes only its own `action`, `returns`, `summary` and `description`, and must not declare `params`: remove them, or write the `source` out in full to give this method params of its own. Both take the same properties, each under a params type of its own name (`WidgetGetEmbedURLParams`, `WidgetGetEmbedHTMLParams`). Name a method on the same resource by its key (`"get_embed_url"`), or one elsewhere by a dotted address read from the root of `resources`: the resource keys as written, then the method key (`"widgets.get_embed_url"`). The config fails to load when the name matches no method, names this method, names a method of another kind, or names a method that itself uses `source.method` (name the method that writes the source instead). Example: `"get_embed_url"` on a `fetch` method beside the `return` method of that name.

**Constraints:** `minLength: 1`

### signedUrl.action

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

### signedUrl.summary

**Type:** `string`

Summary shown on the generated method. Defaults to the summary of the operation the URL comes from, for a method with `source.method` too: it never takes the named method's own `summary`. Example: `"Build a signed image URL"`.

### signedUrl.description

**Type:** `string`

Description shown on the generated method. Defaults to the description of the operation the URL comes from, for a method with `source.method` too: it never takes the named method's own `description`. Example: `"Builds a link to the image that works without an API key."`.

### params

For `kind: signedUrl` methods with a `sign` source: the method's one argument, as an inline object schema or a `$ref` into the API description. Optional: left out, the params are the `sign` endpoint's path parameters, then its query parameters, in the order the API description declares them, with its schemas, descriptions and `required` flags. The signature's `queryField` is left out, and so is every query parameter an explicit `query` does not read with `{ "param": … }` (one it fills with a literal, say). With no `query`, an optional query parameter that is not a string, integer or boolean (an array, an object, a fractional number) is left out, since no SDK could sign it the same way, and a required one fails generation. A param a `defaults` entry fills is optional, even when the API description requires it: the URL still carries it, filled with the default. A `param` signing key is added last as a required string. Write `params` when the URL carries a payload, which serializes them, or to name or type them differently. It compiles into a params model like an operation's, with the same docs, exports and manifest entry. Its properties fill the endpoint's path placeholders and `{ "param": … }` query fields by name, and the payload serializes them in the order declared here. With no `query`, each query parameter of the endpoint is filled from the property of the same name; an optional one with no such property is left out of every URL, and a required one fails generation. A path placeholder's property must be listed in `required`, unless a `defaults` entry fills it, since an optional one would leave a literal `{path}` in the URL, so the method is not generated; parameters read from the API description are always fine, since OpenAPI path parameters are required. A property a `defaults` entry fills must not be listed in `required`: the caller could never leave it out, so the default would never apply. A property the path, a `param` field or the payload reads must be a string, integer or boolean (`null` is allowed except on the path), because a nested object, an array or a fractional number has no spelling every SDK writes the same (languages disagree on how to write `0.00005`): send a number with a fixed precision as an integer or a string. A JSON Schema `default` on a property is documentation only and is never filled in: use `source.sign.defaults`. Leave `params` out with a `request` source (the method takes the operation's parameters) and with `source.method` (it takes the named method's). Example: `{ "type": "object", "required": ["token"], "properties": { "token": { "type": "string" }, "expiration": { "type": "string", "format": "date-time" } } }`, or `{ "$ref": "#/components/schemas/EmbedRequest" }`.

### returns

**Type:** `object`

For `kind: signedUrl` methods: what the method returns. With `return` it is optional and defaults to `{ "type": "string", "format": "uri" }`; one you write must be a string schema that is not `binary`. Such a method makes no request, so it is synchronous. With `fetch` it is required, and it decides how the body is read: `{ "type": "string", "format": "binary" }` returns the raw response; any other string schema (another `format`, a string `enum`, or a `$ref` to one) returns the body as text, never JSON-decoded; anything else is decoded as JSON like any other response. `{}`, `{ "async": true }` alone and `{ "type": "null" }` name no type and fail to load with `fetch`. With `upload` it is left out: the method returns the response that issued the URL, or the confirm step's. Example: `{ "type": "string" }` for an HTML page.

#### async

**Type:** `boolean`

Whether the method is asynchronous. The action decides it, so this key may only restate that: a `return` method makes no request and is synchronous (leave `async` out, or set it to `false`), and a `fetch` method sends one and is asynchronous (leave it out, or set it to `true`). Named `async` rather than `sync`, because Python already has a sync client and the word would mean two things.

#### native

**Type:** `Record<string, string>`

Reserved: a language-native return type per target, to replace the type the schema would generate there (`httpx.URL` instead of `str`). Python, Go, Ruby, PHP, Kotlin, Java, C#, C++, Dart, Swift and Rust read it for a `return` method, and Go for a `fetch` method too. Python takes `str` or `httpx.URL`, and refuses any other name when the SDK is generated. Ruby parses the URL into the type it names (`URI::HTTPS`, through `URI.parse`; any other class through its own `parse`). In PHP, `Psr\Http\Message\UriInterface` returns the URL built through the client's URI factory, `string` the string, and any other class name fails PHP generation, since the SDK has no way to build it. In Swift, `URL` or `URLComponents` (either one `Foundation.`-qualified) returns the URL parsed into that type, and the method can then also throw `ClientError` with `.invalidURL`; any other name returns the `String`. Kotlin and Java take `java.net.URI`, `java.net.URL` or `String`, C# `System.Uri` or `string`, and C++ `std::string` or `std::filesystem::path`; each fails generation for any other type. Go takes `*url.URL` or `string` for a `return` method, and `[]byte` (the fetched body's bytes, whatever its schema says it holds) or `string` (its text) for a `fetch` method, which without one returns the body as its schema says, a text body as `string`; Go fails generation for any other type too. Dart returns a `Uri` for `Uri` (through `Uri.parse`) and the string for `String`, and fails generation on any other type. In Rust, `url::Url` and `http::Uri` return the URL parsed into that type, `String` the string, and any other type fails Rust generation, since the SDK has no way to build it. Every other target that renders signed URLs returns the string; a value is still checked when the config loads, as a qualified type name in that target's own spelling. Example: `{ "python": "httpx.URL", "go": "*url.URL" }`.
<!-- config-reference:end -->

## Related

- [Configuration](configuration.md) — `resources`, methods, and the `clientSettings.opts` entry that holds a key
- [Diagnostics](diagnostics.md) — `Config/InvalidSignedUrl` and `Unsupported/SignedUrlMethod`
- [Webhooks](webhooks.md) — the other side of signing: verifying what your API sends
