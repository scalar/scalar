# MCP OAuth: how MCP authentication works

*Last updated: October 2026*

MCP OAuth is the authorization flow defined by the Model Context Protocol specification, in which an MCP client gets an OAuth 2.1 access token for a remote MCP server by discovering the server's authorization server through protected resource metadata (RFC 9728) and then running an authorization code flow with PKCE. The user signs in through a browser, the client stores the token, and every request to the MCP server carries it as a bearer token.

The point of the design is that a client and a server that have never heard of each other can still complete a secure sign-in with nothing but the server's URL. No API keys pasted into JSON files, no manual app registration, and access that the user can revoke.

To add OAuth to an MCP server, you do not build a login system. Your server becomes an OAuth resource server: it publishes a small metadata document naming your existing authorization server, answers unauthenticated requests with `401` and a `WWW-Authenticate` header that points at that document, and validates the bearer token on every request, including that the token was issued for this server. The official SDKs ship helpers for each step, and there is a tested example below.

This article walks through the flow step by step using the current specification, shows what the discovery documents look like on a real server, shows how to add the flow to your own server, and covers the mistakes that break MCP authentication in practice. Most confusion comes from mixing up two separate layers, how a client authenticates to the MCP server and how the MCP server authenticates to your API, so the article keeps them apart throughout.

**On this page**

- [Which version of the spec this covers](#which-version-of-the-spec-this-covers)
- [The three roles](#the-three-roles)
- [The standards MCP authorization builds on](#the-standards-mcp-authorization-builds-on)
- [The MCP OAuth flow step by step](#the-mcp-oauth-flow-step-by-step)
- [Client registration: CIMD, DCR and pre-registration](#client-registration-cimd-dcr-and-pre-registration)
- [Scopes and step-up authorization](#scopes-and-step-up-authorization)
- [Token rules: audience, passthrough and refresh](#token-rules-audience-passthrough-and-refresh)
- [A real example: inspecting a Scalar MCP server](#a-real-example-inspecting-a-scalar-mcp-server)
- [How to add OAuth to your own MCP server](#how-to-add-oauth-to-your-own-mcp-server)
- [API keys, OAuth and the two layers of MCP auth](#api-keys-oauth-and-the-two-layers-of-mcp-auth)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## Which version of the spec this covers

Everything here refers to the [MCP authorization specification, revision 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization), the current revision at the time of writing. Authorization has changed noticeably across revisions, so it helps to know the milestones when you read older blog posts or debug an older client:

- **2025-06-18** [classified MCP servers as OAuth resource servers](https://modelcontextprotocol.io/specification/2025-06-18/changelog), added protected resource metadata for discovery, and required clients to send RFC 8707 resource indicators.
- **2025-11-25** [added OpenID Connect Discovery, incremental scope consent, and Client ID Metadata Documents](https://modelcontextprotocol.io/specification/2025-11-25/changelog) as the recommended way to register clients.
- **2026-07-28** [deprecated Dynamic Client Registration](https://modelcontextprotocol.io/specification/2026-07-28/changelog) in favour of Client ID Metadata Documents, and added issuer validation of authorization responses (RFC 9207).

Authorization is optional in MCP. It applies to HTTP-based transports; the spec says stdio servers should not use it and should read credentials from the environment instead. If you are unsure which transport you need, read [Remote MCP servers](/learn/mcp/remote-mcp-servers) first. And if you are still deciding whether your tools belong in an MCP server at all, [MCP vs function calling](/learn/mcp/mcp-vs-function-calling) covers that.

## The three roles

MCP maps its pieces onto standard OAuth roles:

- The **MCP server** is an OAuth 2.1 *resource server*. It accepts access tokens and rejects requests without a valid one.
- The **MCP client**, inside a host such as Claude Code, Cursor or VS Code, is an OAuth 2.1 *client* acting on behalf of the user.
- The **authorization server** signs users in and issues tokens. It can be run by the same provider as the MCP server or be a separate identity provider. The spec deliberately does not care which.

That separation is the most important idea in the whole specification. The first authorization revision, 2025-03-26, leaned towards the MCP server acting as its own authorization server. Since 2025-06-18 the server only has to point at one, which means you can put an MCP server in front of an existing identity provider instead of building login from scratch.

## The standards MCP authorization builds on

MCP does not invent a new auth protocol. It picks a subset of existing OAuth specifications and states how strictly each applies.

| Standard | What it does in MCP | Requirement in 2026-07-28 |
| --- | --- | --- |
| [OAuth 2.1 (draft 13)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-13) | Base framework: authorization code flow, bearer tokens | Authorization servers MUST implement it |
| [RFC 9728](https://datatracker.ietf.org/doc/html/rfc9728) Protected Resource Metadata | MCP server tells clients where its authorization server is | Servers MUST implement; clients MUST use it |
| [RFC 8414](https://datatracker.ietf.org/doc/html/rfc8414) Authorization Server Metadata / [OpenID Connect Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html) | Client finds the authorize, token and registration endpoints | Servers MUST offer at least one; clients MUST support both |
| PKCE with `S256` | Protects the authorization code from interception | Clients MUST use it and MUST refuse if the server does not advertise it |
| [RFC 8707](https://www.rfc-editor.org/rfc/rfc8707.html) Resource Indicators | Binds the token to one MCP server | Clients MUST send `resource` on authorize and token requests |
| [Client ID Metadata Documents](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00) | Client identifies itself with an HTTPS URL | SHOULD support |
| [RFC 7591](https://datatracker.ietf.org/doc/html/rfc7591) Dynamic Client Registration | Client registers itself at runtime | MAY support; deprecated |
| [RFC 9207](https://datatracker.ietf.org/doc/html/rfc9207) Issuer Identification | Detects mix-up attacks on the redirect | Servers SHOULD send `iss`; clients MUST validate it when present |

If you only remember two rows, make them RFC 9728 and PKCE. Those are where most broken implementations fail.

## The MCP OAuth flow step by step

Here is the full sequence as the [specification describes it](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization), with the HTTP traffic you would see.

### Step 1: the client calls the server and gets a 401

The client sends an MCP request with no token. A protected server responds with `401 Unauthorized` and a `WWW-Authenticate` header whose `resource_metadata` parameter points at its protected resource metadata. It can also include the scopes it needs:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource/mcp",
                         scope="files:read"
```

If the header is missing, the client falls back to well-known URLs: first with the endpoint path inserted (`/.well-known/oauth-protected-resource/mcp` for an endpoint at `/mcp`), then at the root (`/.well-known/oauth-protected-resource`). Details are in [authorization server discovery](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery).

### Step 2: the client reads the protected resource metadata

The document is small. The field that matters is `authorization_servers`, which MUST list at least one issuer:

```json
{
  "resource": "https://mcp.example.com/mcp",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["files:read", "files:write"],
  "bearer_methods_supported": ["header"]
}
```

### Step 3: the client reads the authorization server metadata

From the issuer URL, the client tries the RFC 8414 location first and then the OpenID Connect locations. For an issuer without a path, that is `/.well-known/oauth-authorization-server`, then `/.well-known/openid-configuration`. For an issuer with a path such as `https://auth.example.com/tenant1`, the path is inserted after the well-known segment.

The client MUST check that the `issuer` in the document exactly matches the issuer it used to build the URL, and MUST check that `code_challenge_methods_supported` is present. If it is missing, the client has to stop, because it cannot use PKCE.

### Step 4: the client gets a client ID

Before it can send the user anywhere, the client needs a `client_id`. There are three ways, covered in the [next section](#client-registration-cimd-dcr-and-pre-registration).

### Step 5: the user signs in

The client generates a PKCE verifier and challenge, records the expected issuer, and opens the browser at the authorization endpoint:

```text
https://auth.example.com/authorize
  ?response_type=code
  &client_id=https%3A%2F%2Fapp.example.com%2Foauth%2Fclient-metadata.json
  &redirect_uri=http%3A%2F%2F127.0.0.1%3A3000%2Fcallback
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
  &resource=https%3A%2F%2Fmcp.example.com%2Fmcp
  &scope=files%3Aread
  &state=af0ifjsldkj
```

Note the `resource` parameter. It carries the canonical URI of the MCP server, and the client MUST send it even if the authorization server ignores it.

### Step 6: the redirect comes back and the client validates it

The authorization server redirects to the callback with a `code` and, ideally, an `iss` parameter. The client compares `iss` with the issuer it recorded, and checks `state`. If `iss` does not match, the client must not use the code or even display the error message, because it may have come from a malicious authorization server.

### Step 7: the client exchanges the code for a token

```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=http%3A%2F%2F127.0.0.1%3A3000%2Fcallback
&client_id=https%3A%2F%2Fapp.example.com%2Foauth%2Fclient-metadata.json
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
&resource=https%3A%2F%2Fmcp.example.com%2Fmcp
```

### Step 8: every MCP request carries the token

```http
POST /mcp HTTP/1.1
Host: mcp.example.com
Authorization: Bearer eyJhbGciOiJFZERTQSJ9...
```

The token goes in the `Authorization` header on every request, never in the query string. The server validates it, including that it was issued for this server, and returns `401` if it is invalid or expired.

## Client registration: CIMD, DCR and pre-registration

This is the part that makes MCP OAuth different from a normal web app integration. A user can paste any server URL into any client, so the client and the authorization server usually have no prior relationship. The [client registration section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration) gives three options and a priority order.

**1. Pre-registration.** If the client already has credentials for this authorization server, it uses them. This is how enterprise setups often work, and it is why Claude, Cursor and VS Code all let you enter an OAuth client ID manually.

**2. Client ID Metadata Documents (CIMD).** The client hosts a JSON document at an HTTPS URL and uses that URL as its `client_id`. The authorization server fetches the document, checks that its `client_id` matches the URL exactly, and validates the redirect URI against it. Authorization servers advertise support with `"client_id_metadata_document_supported": true`. A minimal document:

```json
{
  "client_id": "https://app.example.com/oauth/client-metadata.json",
  "client_name": "Example MCP Client",
  "redirect_uris": ["http://127.0.0.1:3000/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

**3. Dynamic Client Registration (DCR).** The client `POST`s its metadata to the authorization server's `registration_endpoint` and receives a fresh `client_id`. DCR was the original answer to the "no prior relationship" problem, and most servers deployed in 2025 support it. The 2026-07-28 revision marks it as deprecated and keeps it for backward compatibility. When a client uses DCR against an OpenID Connect provider, it MUST send an appropriate `application_type` (`native` for desktop and CLI apps).

Why the move away from DCR? Every DCR call creates a new client record, so authorization servers end up with thousands of anonymous registrations and no way to tell a legitimate client from an impostor. With CIMD the client's identity is a URL on a domain someone controls, which the authorization server can cache and apply trust policies to.

In practice, today's clients try the options roughly in that order and fall back. If you run an authorization server for MCP, supporting both CIMD and DCR covers old and new clients.

## Scopes and step-up authorization

MCP servers should say which scopes an operation needs. On the first `401`, the `scope` parameter in `WWW-Authenticate` tells the client what to ask for. If it is absent, the client falls back to `scopes_supported` from the protected resource metadata.

Later, a tool call might need more. The server then responds with `403 Forbidden` and `error="insufficient_scope"`:

```http
HTTP/1.1 403 Forbidden
WWW-Authenticate: Bearer error="insufficient_scope",
                         scope="files:write",
                         resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource",
                         error_description="File write permission required for this operation"
```

The client runs the flow again, asking for the union of the scopes it already had and the new ones, then retries the call. This is called step-up authorization. The spec asks servers to list every scope an operation needs in one challenge, so the user is not sent through the browser three times for one action. It also recommends keeping `scopes_supported` to the minimum needed for basic use and asking for more only when needed.

## Token rules: audience, passthrough and refresh

Three rules in the [security considerations](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations) prevent the most serious attacks.

**Audience binding.** An MCP server MUST only accept tokens issued for itself, and reject tokens whose audience does not include it. Without this, a token a user granted to one MCP server could be replayed against another.

**No token passthrough.** If your MCP server calls an upstream API, it MUST NOT forward the token it received from the client. It needs its own credential for the upstream API, obtained separately. Forwarding the client's token turns your server into a confused deputy and bypasses the upstream API's own audience checks.

**Refresh tokens.** Clients may ask for `offline_access` if the authorization server lists it, but must not assume a refresh token will be issued. For public clients, authorization servers MUST rotate refresh tokens, and access tokens should be short-lived.

## A real example: inspecting a Scalar MCP server

Scalar's hosted MCP servers have supported OAuth since [17 March 2026](/blog/posts/2026-03-25-scalar-mcp-oauth), so they make a convenient live example. You can reproduce the following with `curl` against any private installation. We ran it on 26 September 2026.

An unauthenticated request returns a `401` with the RFC 9728 pointer:

```bash
curl -i -X POST https://mcp.scalar.com/mcp/YOUR_INSTALL_ID \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

```http
HTTP/2 401
www-authenticate: Bearer realm="mcp", resource_metadata="https://mcp.scalar.com/.well-known/oauth-protected-resource/mcp/YOUR_INSTALL_ID"
```

The protected resource metadata names a per-installation authorization server:

```json
{
  "resource": "https://mcp.scalar.com/mcp/YOUR_INSTALL_ID",
  "authorization_servers": ["https://mcp.scalar.com/api/auth/mcp/YOUR_INSTALL_ID"],
  "bearer_methods_supported": ["header"]
}
```

Because that issuer has a path, the client inserts it after the well-known segment, exactly as the spec describes: `https://mcp.scalar.com/.well-known/oauth-authorization-server/api/auth/mcp/YOUR_INSTALL_ID`. The metadata it returns includes, among other fields:

```json
{
  "issuer": "https://mcp.scalar.com/api/auth/mcp/YOUR_INSTALL_ID",
  "authorization_endpoint": "https://mcp.scalar.com/api/auth/oauth2/authorize",
  "token_endpoint": "https://mcp.scalar.com/api/auth/oauth2/token",
  "registration_endpoint": "https://mcp.scalar.com/api/auth/mcp/YOUR_INSTALL_ID/oauth2/register",
  "code_challenge_methods_supported": ["S256"],
  "authorization_response_iss_parameter_supported": true,
  "grant_types_supported": ["authorization_code", "client_credentials", "refresh_token"],
  "token_endpoint_auth_methods_supported": ["none", "client_secret_basic", "client_secret_post"]
}
```

Reading it against the table earlier: RFC 9728 discovery, RFC 8414 path-insertion discovery, PKCE with `S256`, a registration endpoint for Dynamic Client Registration, and the RFC 9207 `iss` parameter. Each installation also gets its own issuer, which keeps sign-ins for one MCP server separate from another.

What the user sees is simpler. Their client opens a browser on Scalar's sign-in page, they sign in with an email one-time code or through SSO, Scalar checks their email against the installation's [access groups](/products/agent/authentication/customer-access), and the client receives a token. No Scalar dashboard access is granted, only the MCP server. You can brand that page with a login portal.

## How to add OAuth to your own MCP server

If you host the server yourself, the work is on the resource server side only. You need an authorization server that already exists (Auth0, Okta, Keycloak, Entra ID, or your own), advertises PKCE, and can issue tokens whose audience is your MCP server's URL. Then your server has to do three things:

1. Serve the RFC 9728 protected resource metadata at `/.well-known/oauth-protected-resource/<path>`, naming the authorization server.
2. Reject requests without a valid bearer token with `401` and a `WWW-Authenticate` header that carries `resource_metadata`.
3. Validate each token: signature or introspection, expiry, scopes, and that it was issued for this server.

The TypeScript SDK v2 (`@modelcontextprotocol/server`) has a helper for each step. This example runs on Node.js with the `@modelcontextprotocol/node` adapter; the handler itself is web-standard, so the same code works on Cloudflare Workers, Deno, and Bun without the adapter. We ran it on 7 October 2026 with the versions listed at the end of the page.

```ts
import { createServer } from 'node:http'
import { toNodeHandler } from '@modelcontextprotocol/node'
import {
  McpServer,
  OAuthError,
  OAuthErrorCode,
  createMcpHandler,
  getOAuthProtectedResourceMetadataUrl,
  oauthMetadataResponse,
  requireBearerAuth,
  type AuthInfo,
  type AuthMetadataOptions,
} from '@modelcontextprotocol/server'
import * as z from 'zod/v4'

// The public URL of this MCP server. Tokens must be issued for exactly this resource.
const serverUrl = new URL(process.env.MCP_SERVER_URL ?? 'http://localhost:3000/mcp')

// Your existing OAuth 2.1 authorization server. The MCP server only points at it.
const authMetadata: AuthMetadataOptions = {
  resourceServerUrl: serverUrl,
  scopesSupported: ['orders:read'],
  oauthMetadata: {
    issuer: 'https://auth.example.com',
    authorization_endpoint: 'https://auth.example.com/authorize',
    token_endpoint: 'https://auth.example.com/token',
    response_types_supported: ['code'],
    code_challenge_methods_supported: ['S256'],
  },
}

// Replace this with real validation: JWT signature and claims, or RFC 7662 introspection.
const verifier = {
  verifyAccessToken: async (token: string): Promise<AuthInfo> => {
    if (token !== process.env.DEMO_TOKEN) {
      throw new OAuthError(OAuthErrorCode.InvalidToken, 'Unknown token')
    }
    return {
      token,
      clientId: 'demo-client',
      scopes: ['orders:read'],
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      resource: serverUrl,
    }
  },
}

const gate = requireBearerAuth({
  verifier,
  requiredScopes: ['orders:read'],
  expectedResource: serverUrl,
  resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(serverUrl),
})

const mcp = createMcpHandler(() => {
  const server = new McpServer({ name: 'orders', version: '1.0.0' })
  server.registerTool(
    'get_order',
    { description: 'Fetch one order by its ID.', inputSchema: z.object({ orderId: z.string() }) },
    async ({ orderId }) => ({ content: [{ type: 'text', text: `order ${orderId}` }] }),
  )
  return server
})

const handler = toNodeHandler({
  fetch: async (request: Request): Promise<Response> => {
    // 1. Serve the discovery documents at /.well-known/...
    const discovery = oauthMetadataResponse(request, authMetadata)
    if (discovery) return discovery
    // 2. Require a valid bearer token; failures become 401/403 with WWW-Authenticate
    const auth = await gate(request)
    if (auth instanceof Response) return auth
    // 3. Serve MCP with the verified identity attached
    return mcp.fetch(request, { authInfo: auth })
  },
})

createServer((request, response) => handler(request, response)).listen(3000, '127.0.0.1')
```

With `DEMO_TOKEN=secret123 npx tsx oauth-server.ts` running, an unauthenticated `tools/list` gets the challenge that starts the client's discovery:

```http
HTTP/1.1 401 Unauthorized
www-authenticate: Bearer error="invalid_token", error_description="Missing Authorization header",
                         scope="orders:read",
                         resource_metadata="http://localhost:3000/.well-known/oauth-protected-resource/mcp"
```

The protected resource metadata names the authorization server and the scopes:

```json
{
  "resource": "http://localhost:3000/mcp",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["orders:read"]
}
```

And the same request with `Authorization: Bearer secret123` returns the tool list. Three things the example leaves to you, deliberately:

- **Token validation.** The demo compares a string. A real verifier checks a JWT signature against the authorization server's JWKS, or calls its introspection endpoint, and fills `expiresAt`, `scopes`, and `resource` from the token's claims. The `expectedResource` option then enforces audience binding for you.
- **Client registration.** That is the authorization server's job. Make sure it supports Client ID Metadata Documents or Dynamic Client Registration, or pre-register the clients you expect.
- **HTTPS.** The example allows a plain `http://localhost` resource for testing; the metadata helper refuses a non-HTTPS issuer, and production needs TLS everywhere.

In Python, the official SDK's `MCPServer` takes `auth=AuthSettings(...)` with a `token_verifier`, and its Streamable HTTP app serves the same discovery documents and challenges. The [Python SDK documentation](https://py.sdk.modelcontextprotocol.io/) covers it. And if you would rather not run any of this, Scalar's hosted servers implement the whole flow for an OpenAPI-described API, as the previous section showed.

## API keys, OAuth and the two layers of MCP auth

When people say "MCP authentication" they often mean two different things, and mixing them up causes most design mistakes.

1. **Who may connect to the MCP server.** This is what the MCP authorization spec covers: the client proves the user is allowed to use this server.
2. **How the MCP server calls the upstream API.** This is a separate credential, and the no-passthrough rule means it cannot be the token from layer 1.

Scalar's [authentication guide](/products/agent/authentication) is built around this split. For layer 1, an installation can be public, limited to your team (personal access token or OAuth), or open to an access group via OAuth. For layer 2, you either store one credential on the installation ([global auth](/products/agent/authentication/shared-key)) or let each caller supply their own key in a header you nominate, which Scalar forwards without storing ([passthrough auth](/products/agent/authentication/public-passthrough)). There is one opt-in exception to the no-passthrough rule: with [OAuth passthrough](/products/agent/authentication/oauth-passthrough), clients sign in with your API's own authorization server and Scalar forwards that token to your API. The MCP server does not validate the token in that mode, so your API has to check its audience, expiry and scopes itself. The credential types you can store follow the security schemes in your OpenAPI document; [OpenAPI security schemes](/learn/openapi/openapi-security-schemes) explains those.

API keys in an `Authorization` header are still common for layer 1, especially for headless agents and CI. Stripe, for example, [documents both OAuth and restricted agent keys](https://docs.stripe.com/mcp) for its MCP server. OAuth is the better default for anything a person uses interactively, because consent and revocation are built in.

## Common mistakes

- **Returning 403 or a redirect instead of 401.** Clients only start discovery on a `401` with a usable `WWW-Authenticate` header.
- **Missing `code_challenge_methods_supported`.** Some identity providers support PKCE but do not advertise it. MCP clients are required to refuse, so the flow fails before the browser even opens.
- **Wrong well-known path for issuers with a path component.** `https://auth.example.com/tenant1` is discovered at `/.well-known/oauth-authorization-server/tenant1`, not `/tenant1/.well-known/...` (that form is only an OpenID Connect fallback).
- **Accepting any valid token.** A token signed by your identity provider is not automatically meant for your MCP server. Check the audience.
- **Forwarding the client's token upstream.** Explicitly forbidden. Get a separate upstream credential.
- **Asking for every scope up front.** Users are more likely to approve a narrow request, and step-up exists precisely so you do not have to.
- **Testing only with one client.** Claude Code, Cursor and VS Code each implement discovery and registration slightly differently. Test the full flow in at least two.

If you would rather not build any of this yourself, most of the vendor-hosted servers in [MCP server examples](/learn/mcp/mcp-server-examples) already implement the flow, and a hosted platform can do it for your own API. [OpenAPI to MCP server](/learn/mcp/openapi-to-mcp-server) and our [roundup of MCP server generators](/library/best-mcp-server-generators-2026) compare the options, and Scalar's [getting started guide](/products/agent/getting-started) goes from an OpenAPI document to an OAuth-protected server.

## Frequently asked questions

<scalar-detail title="Does MCP require OAuth?">
No. Authorization is optional in the MCP specification. When an HTTP-based server does require authorization, the spec says it should follow the OAuth 2.1 based flow described here. Servers that run locally over stdio should use environment variables instead.
</scalar-detail>

<scalar-detail title="Which OAuth version does MCP use?">
OAuth 2.1, currently referenced as IETF draft 13, together with RFC 9728 protected resource metadata, RFC 8414 or OpenID Connect discovery, PKCE with S256, and RFC 8707 resource indicators. The current MCP revision is 2026-07-28.
</scalar-detail>

<scalar-detail title="What is RFC 9728 and why does MCP need it?">
RFC 9728 defines a small metadata document a protected resource publishes to say which authorization servers issue tokens for it. MCP servers must publish it, and clients find it through the 401 response or a well-known URL. It is what lets a client start sign-in knowing only the MCP server's URL.
</scalar-detail>

<scalar-detail title="Is Dynamic Client Registration still supported in MCP?">
Yes, but it is deprecated as of revision 2026-07-28. The recommended mechanism is Client ID Metadata Documents, where the client_id is an HTTPS URL pointing at the client's metadata. Dynamic Client Registration remains for compatibility with authorization servers that do not support that yet.
</scalar-detail>

<scalar-detail title="Can I use my existing identity provider for MCP authentication?">
Usually, yes. The MCP server only has to point at an authorization server through protected resource metadata. The identity provider must advertise PKCE support, and ideally support Client ID Metadata Documents or Dynamic Client Registration so clients can register without manual setup.
</scalar-detail>

<scalar-detail title="Can an MCP server pass the user's token to my API?">
No. The specification forbids token passthrough. The MCP server must validate that the token was issued for itself and use a separate credential when it calls an upstream API.
</scalar-detail>

<scalar-detail title="How does OAuth work on Scalar MCP servers?">
Installations are private by default. When a client connects, it discovers Scalar's authorization server from the 401 response, opens a browser, and the user signs in with an email one-time code or SSO. Scalar checks the email against the installation's access groups before issuing a token. Team members can also use a personal access token.
</scalar-detail>

## Related

- **Learn:** [How to host an MCP server](/learn/mcp/host-mcp-server) · [Remote MCP servers](/learn/mcp/remote-mcp-servers) · [How to build an MCP server](/learn/mcp/build-mcp-server) · [Generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi) · [OpenAPI security schemes](/learn/openapi/openapi-security-schemes)
- **Docs:** [MCP authentication](/products/agent/authentication) · [Private access for customers](/products/agent/authentication/customer-access)
- **Product:** [Scalar MCP](/products/agent/mcp) — hosted MCP servers with OAuth, access groups and branded sign-in

*Specification details refer to MCP revision 2026-07-28 and were re-checked against modelcontextprotocol.io on 7 October 2026, when 2026-07-28 was still the current revision. The Scalar metadata shown was retrieved on 26 September 2026 and trimmed for length; the client_id, code and verifier values in the flow examples are illustrative. The resource server example was run on 7 October 2026 with @modelcontextprotocol/server 2.3.1, @modelcontextprotocol/node 2.1.1 and zod 4.6.5 on Node.js 24.21.0.*
