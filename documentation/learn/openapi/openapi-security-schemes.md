# OpenAPI security schemes: every type with examples

*Last updated: September 2026*

*By Marc Laventure · Reviewed by: pending*

An OpenAPI security scheme is a named description of one way a client can authenticate with your API, such as an API key in a header, an HTTP bearer token, an OAuth 2.0 flow, OpenID Connect, or a mutual TLS client certificate. You declare schemes under `components.securitySchemes`, then apply them with `security` requirements at the document or operation level, so every tool that reads the [OpenAPI document](/learn/openapi/what-is-openapi) knows exactly what credentials each request needs.

OpenAPI 3.1 and 3.2 support five scheme types: `apiKey`, `http`, `oauth2`, `openIdConnect` and `mutualTLS`. This guide gives valid YAML for each one, explains how requirements combine, covers what changed in OpenAPI 3.2, and shows how Scalar's API reference and API client turn these declarations into a working authentication panel.

For a gentler introduction, including how frameworks such as Hono, ASP.NET Core and FastAPI emit these definitions, read our earlier post, [A guide to OpenAPI security](/blog/posts/2025-03-26-a-guide-to-openapi-security-and-how). This page is the reference.

**On this page**

- [The short answer](#the-short-answer)
- [The five security scheme types](#the-five-security-scheme-types)
- [apiKey](#apikey)
- [http: Basic, Bearer and others](#http-basic-bearer-and-others)
- [oauth2 and its flows](#oauth2-and-its-flows)
- [openIdConnect](#openidconnect)
- [mutualTLS](#mutualtls)
- [Applying schemes: AND, OR, optional and scopes](#applying-schemes-and-or-optional-and-scopes)
- [What changed in OpenAPI 3.2](#what-changed-in-openapi-32)
- [Coming from Swagger 2.0](#coming-from-swagger-20)
- [How Scalar renders security schemes](#how-scalar-renders-security-schemes)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

Two pieces work together:

```yaml
components:
  securitySchemes:
    bearerAuth:          # 1. Declare a scheme and give it a name
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []       # 2. Require it for every operation
```

`securitySchemes` is the list of ways to authenticate. `security` says which of them each operation needs. A scheme that is declared but never referenced in a `security` requirement does nothing, which is one of the most common mistakes in real documents.

## The five security scheme types

The [Security Scheme Object in OpenAPI 3.2.1](https://spec.openapis.org/oas/v3.2.1.html#security-scheme-object) defines these types and required fields:

| `type` | Required fields | Credential goes in | Available since | Typical use |
| --- | --- | --- | --- | --- |
| `apiKey` | `name`, `in` (`header`, `query` or `cookie`) | The named header, query parameter or cookie | Swagger 2.0 | Server-to-server APIs, simple developer keys |
| `http` | `scheme` (plus optional `bearerFormat`) | The `Authorization` header | OpenAPI 3.0 (`basic` existed in 2.0) | Bearer tokens, JWTs, HTTP Basic |
| `oauth2` | `flows` | Usually an `Authorization: Bearer` header, after a token flow | Swagger 2.0, reshaped in 3.0 | Delegated user access, machine-to-machine tokens |
| `openIdConnect` | `openIdConnectUrl` | Same as OAuth 2.0, endpoints discovered | OpenAPI 3.0 | Identity providers that publish discovery documents |
| `mutualTLS` | none beyond `type` | The TLS handshake, as a client certificate | OpenAPI 3.1 | High-trust B2B and financial APIs |

Every type also accepts an optional `description`, which supports CommonMark. Use it. It is the only place to tell people where to get a key.

## apiKey

An API key is a static secret sent in a header, a query parameter, or a cookie. The `name` is the header, parameter or cookie name, and `in` says where it goes.

```yaml
components:
  securitySchemes:
    apiKeyHeader:
      type: apiKey
      in: header
      name: X-API-Key
      description: Create a key in the dashboard under Settings → API keys.
    apiKeyCookie:
      type: apiKey
      in: cookie
      name: session_id
    apiKeyQuery:
      type: apiKey
      in: query
      name: api_key
```

Prefer headers. Query strings end up in server logs, proxy logs, browser history and analytics tools, so a key in the URL leaks easily. If you must support query keys for legacy clients, document them as deprecated and enforce the policy with a linting rule; the [Spectral rules guide](/learn/openapi/spectral-rules) has one you can copy.

## http: Basic, Bearer and others

The `http` type covers any scheme sent in the `Authorization` header as defined by HTTP. The `scheme` value is the authentication scheme name, which the specification says should be registered with IANA and is case-insensitive.

```yaml
components:
  securitySchemes:
    basicAuth:
      type: http
      scheme: basic
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: A JWT issued by the /auth/token endpoint.
```

**Basic** sends `Authorization: Basic <base64(username:password)>`. Base64 is encoding, not encryption, so Basic is only acceptable over TLS, and even then a static username and password is a weak credential for most public APIs.

**Bearer** sends `Authorization: Bearer <token>`. `bearerFormat` is a hint for humans and tools (`JWT` is the common value); the specification notes it is "primarily for documentation purposes". It does not change how the token is sent.

Do not describe the `Authorization` header as a regular parameter. The specification says a header parameter named `Authorization` (or `Accept` or `Content-Type`) "SHALL be ignored", so tools will drop it. Use a security scheme instead.

## oauth2 and its flows

An `oauth2` scheme lists one or more flows, each with the endpoints and scopes for that grant type. OpenAPI 3.2 supports five flows:

| Flow | Required fields | OAuth grant | Use it for |
| --- | --- | --- | --- |
| `authorizationCode` | `authorizationUrl`, `tokenUrl`, `scopes` | Authorization code, ideally with PKCE | Apps acting on behalf of a user |
| `clientCredentials` | `tokenUrl`, `scopes` | Client credentials | Machine-to-machine access |
| `deviceAuthorization` (3.2+) | `deviceAuthorizationUrl`, `tokenUrl`, `scopes` | Device authorization (RFC 8628) | CLIs, TVs, devices without a browser |
| `implicit` | `authorizationUrl`, `scopes` | Implicit | Legacy only |
| `password` | `tokenUrl`, `scopes` | Resource owner password | Legacy first-party apps only |

Every flow can also have a `refreshUrl`. `scopes` is a map from scope name to a short description, and it may be empty.

A realistic scheme offers the authorization code flow for user access and client credentials for back-end services:

```yaml
components:
  securitySchemes:
    oauth:
      type: oauth2
      description: OAuth 2.0 via auth.example.com.
      flows:
        authorizationCode:
          authorizationUrl: https://auth.example.com/oauth2/authorize
          tokenUrl: https://auth.example.com/oauth2/token
          refreshUrl: https://auth.example.com/oauth2/token
          scopes:
            orders:read: Read your orders
            orders:write: Create and update orders
        clientCredentials:
          tokenUrl: https://auth.example.com/oauth2/token
          scopes:
            orders:read: Read all orders
```

Two notes from the specification itself. First, it points out that the implicit flow "is about to be deprecated" by the OAuth 2.0 Security Best Current Practice and recommends the authorization code grant with PKCE for most use cases. Second, every OAuth URL must be a URL and the OAuth standard requires TLS, so `http://` endpoints are only for local development.

OpenAPI has no standard field for "this flow uses PKCE". Scalar reads the `x-usePkce` extension (`SHA-256`, `plain` or `no`) on an `authorizationCode` flow so the client can run PKCE automatically:

```yaml
flows:
  authorizationCode:
    authorizationUrl: https://auth.example.com/oauth2/authorize
    tokenUrl: https://auth.example.com/oauth2/token
    x-usePkce: SHA-256
    scopes:
      orders:read: Read your orders
```

If you are publishing an [API catalog](/learn/openapi/api-catalog), record each API's schemes there too. If you are securing an MCP server rather than a REST API, the OAuth details differ in important ways; see [MCP OAuth](/learn/mcp/mcp-oauth).

## openIdConnect

OpenID Connect builds an identity layer on top of OAuth 2.0. Instead of listing endpoints yourself, you point at the provider's discovery document and clients read the endpoints, supported grants and scopes from there.

```yaml
components:
  securitySchemes:
    oidc:
      type: openIdConnect
      openIdConnectUrl: https://auth.example.com/.well-known/openid-configuration
```

Scopes for OpenID Connect are listed in the `security` requirement, as with OAuth 2.0:

```yaml
security:
  - oidc: [openid, profile, email]
```

This is the least effort to maintain when your identity provider (Auth0, Okta, Microsoft Entra ID, Keycloak and others) publishes a standard discovery document, because the endpoints cannot drift from what the provider actually serves.

## mutualTLS

Mutual TLS authenticates the client with an X.509 certificate during the TLS handshake. There are no extra fields, because nothing is sent in the HTTP request itself; the `description` is where you explain which certificate authority must sign the client certificate.

```yaml
components:
  securitySchemes:
    clientCert:
      type: mutualTLS
      description: Client certificates must be signed by the Example Corp partner CA.
```

`mutualTLS` was added in OpenAPI 3.1, so a 3.0 document cannot declare it. Tools can document it but cannot "fill it in" the way they fill in a token: the certificate is chosen by the operating system or browser, or configured in your HTTP library.

## Applying schemes: AND, OR, optional and scopes

`security` is a list of Security Requirement Objects. The rules from the specification are short and worth memorizing:

- Each requirement object may name several schemes. **All** schemes in one object must be satisfied (AND).
- The list may contain several requirement objects. **Any one** of them is enough (OR).
- An empty object `{}` means anonymous access is allowed, which makes authentication optional.
- For `oauth2` and `openIdConnect`, the array holds the required scopes. For other types it may hold role names, which are informational only.
- An operation's `security` replaces the document-level one entirely. `security: []` on an operation removes all requirements for it.

```yaml
openapi: 3.1.0
info:
  title: Orders API
  version: 1.0.0
security:
  - oauth: [orders:read]        # Option 1: OAuth with the read scope
  - apiKeyHeader: []            # Option 2: an API key
paths:
  /orders:
    get:
      operationId: listOrders
      # Inherits the document-level requirement: OAuth OR API key
      responses:
        '200':
          description: OK
    post:
      operationId: createOrder
      security:
        - oauth: [orders:write]
          clientCert: []        # OAuth AND a client certificate
      responses:
        '201':
          description: Created
  /status:
    get:
      operationId: getStatus
      security: []              # Public: no authentication
      responses:
        '200':
          description: OK
  /catalog:
    get:
      operationId: listProducts
      security:
        - {}                    # Anonymous allowed...
        - apiKeyHeader: []      # ...or send a key for higher limits
      responses:
        '200':
          description: OK
components:
  securitySchemes:
    apiKeyHeader:
      type: apiKey
      in: header
      name: X-API-Key
    clientCert:
      type: mutualTLS
    oauth:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.example.com/oauth2/authorize
          tokenUrl: https://auth.example.com/oauth2/token
          scopes:
            orders:read: Read orders
            orders:write: Create orders
```

## What changed in OpenAPI 3.2

OpenAPI 3.2 added three things to security schemes. They are only valid in documents that declare `openapi: 3.2.x`.

**The device authorization flow.** `flows.deviceAuthorization` describes the OAuth 2.0 device grant from RFC 8628, used by command-line tools and devices without a browser. It requires `deviceAuthorizationUrl`, `tokenUrl` and `scopes`.

**`oauth2MetadataUrl`.** An `oauth2` scheme can point at the authorization server's metadata document (RFC 8414). TLS is required.

**`deprecated`.** Any scheme can be marked `deprecated: true`, telling consumers to stop using it. This makes migrations, such as retiring API keys in favor of OAuth, visible in the document instead of in an email.

```yaml
openapi: 3.2.0
info:
  title: Devices API
  version: 2.0.0
paths: {}
components:
  securitySchemes:
    legacyKey:
      type: apiKey
      in: header
      name: X-API-Key
      deprecated: true
      description: Deprecated. Use OAuth 2.0 instead.
    oauth:
      type: oauth2
      oauth2MetadataUrl: https://auth.example.com/.well-known/oauth-authorization-server
      flows:
        deviceAuthorization:
          deviceAuthorizationUrl: https://auth.example.com/oauth2/device
          tokenUrl: https://auth.example.com/oauth2/token
          scopes:
            devices:read: Read device status
```

OpenAPI 3.2 also lets a Security Requirement refer to a scheme by URI instead of by component name. Most documents will not need this, and the specification recommends against component names that look like URIs because of how the two are matched. For more on the version differences, read [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0).

## Coming from Swagger 2.0

Swagger 2.0 called these `securityDefinitions`, at the top level of the document, and had only three types: `basic`, `apiKey` and `oauth2`. Each OAuth scheme had a single `flow` with different names:

| Swagger 2.0 | OpenAPI 3.x |
| --- | --- |
| `securityDefinitions` | `components.securitySchemes` |
| `type: basic` | `type: http`, `scheme: basic` |
| `flow: implicit` | `flows.implicit` |
| `flow: password` | `flows.password` |
| `flow: application` | `flows.clientCredentials` |
| `flow: accessCode` | `flows.authorizationCode` |

You do not have to convert these by hand. The [Scalar CLI](/tools/cli/getting-started) upgrades a Swagger 2.0 document to OpenAPI 3.1 with `npx @scalar/cli document upgrade swagger.json --output openapi.json`, and the Scalar API Client does the same automatically on import. See [OpenAPI vs Swagger](/learn/openapi/openapi-vs-swagger) for the naming history.

## How Scalar renders security schemes

The point of describing authentication precisely is that tools can then do it for people. Here is what the [Scalar API reference](/products/api-references) and [API client](/products/api-client) do with each part of the document.

**One auth panel per operation.** The reference reads `security` for each operation and shows the schemes that satisfy it. When a requirement combines several schemes (AND), the panel asks for each of them; when there are alternatives (OR), the reader picks one. Whatever the reader enters is applied to "Test Request" calls from the reference.

**Scheme-specific forms.** API keys show a value field with the header, query or cookie name from the document. HTTP Basic shows username and password, Bearer shows a token field. OAuth 2.0 shows the flow's fields (authorization URL, token URL, client ID, secret where needed, scopes from the document) and runs the flow end to end, opening the provider's consent screen for user flows and storing access and refresh tokens. OpenID Connect fetches the discovery document to fill in the endpoints. For `mutualTLS`, there is nothing to type, so the panel explains that the client certificate is provided during the TLS handshake.

**3.2 support.** Recent versions of the client handle the `deviceAuthorization` flow, showing the user code and verification URL, and can use `oauth2MetadataUrl` to fill in endpoints a flow leaves out.

**Prefilled credentials for your readers.** In the reference configuration, `authentication.preferredSecurityScheme` picks the default scheme (or an AND/OR combination), and `authentication.securitySchemes` can prefill values such as a sandbox API key or an OAuth client ID:

```js
Scalar.createApiReference('#app', {
  url: '/openapi.json',
  authentication: {
    preferredSecurityScheme: 'oauth',
    securitySchemes: {
      apiKeyHeader: {
        name: 'X-API-Key',
        in: 'header',
        value: 'sandbox-key-123',
      },
      oauth: {
        flows: {
          authorizationCode: {
            'x-scalar-client-id': 'docs-client',
            'x-usePkce': 'SHA-256',
            selectedScopes: ['orders:read'],
          },
        },
      },
    },
  },
})
```

Only prefill values that are safe to publish, such as sandbox keys or public client IDs. The full list of options, including `persistAuth` for remembering credentials across page loads, is in the [API reference configuration](/products/api-references/configuration).

**The same schemes everywhere.** The API client uses the same authentication components, stores credentials per collection with operation-level overrides, and never exports them with the document; see [API client authentication](/products/api-client/authentication). The [Scalar mock server](/learn/openapi/api-mocking) enforces the same schemes on the operations that require them, so you can test your auth handling before the real API exists.

## Common mistakes

**Declaring schemes but never requiring them.** Without a `security` requirement at the document or operation level, tools treat every operation as public.

**Expecting operation `security` to merge with the global one.** It replaces it. If an operation needs the global scheme plus an extra scope, list it all.

**Using `security: []` when you meant optional.** An empty list removes authentication for the operation. To make it optional, include `{}` as one of the alternatives.

**Putting `Authorization` in `parameters`.** The specification says tools must ignore it. Use an `http` or `apiKey` scheme.

**Mismatched scope names.** Scopes in a requirement must exist in the flow's `scopes` map. A typo means the client requests a scope the provider does not know.

**Using `implicit` or `password` for new APIs.** Both are discouraged by current OAuth guidance. Use the authorization code flow with PKCE for users and client credentials for services.

**Using 3.1 or 3.2 features in an older document.** `mutualTLS` needs 3.1; `deviceAuthorization`, `oauth2MetadataUrl` and `deprecated` need 3.2. Validators will reject them in a document that declares an earlier version.

## Frequently asked questions

<scalar-detail title="What is the difference between securitySchemes and security in OpenAPI?">
`components.securitySchemes` declares the ways a client can authenticate and gives each a name. `security` applies those schemes, either to the whole document or to individual operations, and says which ones (and which scopes) each request needs.
</scalar-detail>

<scalar-detail title="How do I add a bearer token to an OpenAPI document?">
Declare a scheme with `type: http` and `scheme: bearer` under `components.securitySchemes`, optionally with `bearerFormat: JWT`, then reference it in `security`, for example `security: [{ bearerAuth: [] }]`.
</scalar-detail>

<scalar-detail title="How do I make authentication optional for an endpoint?">
Add an empty Security Requirement Object as one of the alternatives, for example `security: [{}, { apiKey: [] }]`. The empty object means anonymous access is allowed. `security: []` removes authentication for that operation entirely.
</scalar-detail>

<scalar-detail title="How do I require two security schemes at the same time?">
Put both schemes in the same Security Requirement Object, for example `security: [{ apiKey: [], clientCert: [] }]`. Schemes listed in one object are combined with AND; separate objects are alternatives combined with OR.
</scalar-detail>

<scalar-detail title="Does OpenAPI 3.0 support mutual TLS?">
No. The `mutualTLS` type was added in OpenAPI 3.1. In a 3.0 document you can only mention the certificate requirement in a description.
</scalar-detail>

<scalar-detail title="Is securityDefinitions still valid?">
Only in Swagger 2.0 documents. OpenAPI 3.0 and later use `components.securitySchemes`. Upgrading the document converts one to the other.
</scalar-detail>

## Related

- **Learn:** [What is an API client?](/learn/openapi/what-is-an-api-client) · [Spectral rules](/learn/openapi/spectral-rules) · [MCP OAuth](/learn/mcp/mcp-oauth)
- **Docs:** [API reference authentication configuration](/products/api-references/configuration)
- **Product:** [Scalar API reference](/products/api-references) — interactive docs that turn your security schemes into a working auth panel, free and open source.
