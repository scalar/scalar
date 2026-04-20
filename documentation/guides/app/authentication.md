# Authentication

Scalar reads security schemes from your OpenAPI description and lets you fill in credentials once, then reuses them for every request that needs them. Authentication can be set at the collection level or overridden on a single operation.

All auth fields accept environment variables — reference them with `{{ variableName }}` to avoid hard-coding secrets. See [Environments](./environments.md).

## Supported schemes

- HTTP Basic
- HTTP Bearer
- API Key (header, query, or cookie)
- OAuth 2.0 — authorization code, client credentials, implicit, password
- OpenID Connect

Schemes come from `components.securitySchemes` in your OpenAPI document. The `security` requirement at the document or operation level determines which scheme is preselected. An empty requirement (`security: []`) marks auth as optional for that operation.

## Configure authentication

Open your collection settings and find the **Authentication** section, or open an operation's Authentication tab to override it for a single request. Credentials are persisted in your workspace and are never exported with the OpenAPI document.

## HTTP Basic

Enter a **Username** and **Password**. The client sends them as an `Authorization: Basic <base64>` header.

## HTTP Bearer

Paste the token into the **Token** field. The client sends `Authorization: Bearer <token>`.

## API Key

Enter a **Value**. The key name and location (`header`, `query`, or `cookie`) come from the `apiKey` scheme in your OpenAPI document and are not editable from the client.

## OAuth 2.0

Scalar runs OAuth flows end-to-end: Fill in the form and click **Authorize**. The app opens the provider's consent popup (for user-facing flows) or exchanges credentials directly with the token endpoint (for machine-to-machine flows), then stores the access token — and refresh token, if returned — for subsequent requests. Click **Clear** to forget the tokens and start over.

### Authorization Code

User-driven flow. The user consents in a browser popup and Scalar exchanges the returned code for an access token.

| Field | Description |
| --- | --- |
| Auth URL | Authorization endpoint |
| Token URL | Token exchange endpoint |
| Redirect URL | Must match an allowed redirect configured at the provider. Defaults to the current page origin. |
| Client ID | Application client identifier |
| Client Secret | Required for confidential clients |
| Use PKCE | `SHA-256` (recommended), `plain`, or `no` |
| Credentials Location | Send client credentials in the `header` (HTTP Basic) or the `body` (form-encoded) of the token request |
| Scopes | Pick from the scopes defined by the scheme |

### Client Credentials

Machine-to-machine flow. No user interaction — Scalar exchanges the client ID and secret for a token directly.

| Field | Description |
| --- | --- |
| Token URL | Token exchange endpoint |
| Client ID | Application client identifier |
| Client Secret | Application secret |
| Credentials Location | `header` or `body` |
| Scopes | Requested scopes |

### Implicit

Browser-based flow where the access token is returned directly from the authorize endpoint. No token exchange.

| Field | Description |
| --- | --- |
| Auth URL | Authorization endpoint |
| Redirect URL | Must match an allowed redirect at the provider |
| Client ID | Application client identifier |
| Scopes | Requested scopes |

### Password

Username and password are exchanged for a token directly. Intended for trusted first-party applications.

| Field | Description |
| --- | --- |
| Token URL | Token exchange endpoint |
| Client ID | Application client identifier |
| Client Secret | Application secret |
| Username, Password | User credentials |
| Credentials Location | `header` or `body` |
| Scopes | Requested scopes |

## OpenID Connect

Same fields as OAuth 2.0. Scalar fetches the provider's `.well-known/openid-configuration` document to discover the authorization and token endpoints automatically, so you only need to supply the client credentials.

## Multiple schemes

OpenAPI can require several schemes together, or allow any one of several schemes to satisfy a request. Scalar mirrors this:

- **One requirement, multiple schemes:** every listed scheme must be satisfied (AND).
- **Multiple requirements:** any single requirement satisfies the request (OR).

When more than one scheme is active, the Authentication panel shows a **Multiple** badge and prompts for each required scheme.

```yaml
# AND: both apiKey and oauth are required
security:
  - apiKey: []
    oauth: [read]

# OR: either apiKey or oauth is sufficient
security:
  - apiKey: []
  - oauth: [read]
```

## Customize OAuth in OpenAPI Documents

Several Scalar extensions customize OAuth behavior at authoring time. Add them under a flow in `components.securitySchemes`:

```yaml
openapi: 3.1.0
info:
  title: Example
  version: 1.0
components:
  securitySchemes:
    oauth:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://example.com/authorize
          tokenUrl: https://example.com/token
          scopes:
            read: Read access
            write: Write access
          x-default-scopes:
            - read
          x-usePkce: SHA-256
          x-tokenName: custom_access_token
          x-scalar-credentials-location: header
          x-scalar-security-query:
            prompt: consent
            audience: https://api.example.com
          x-scalar-security-body:
            resource: user-profile
```

| Extension | Applies to | Description |
| --- | --- | --- |
| `x-default-scopes` | OAuth flows | Scopes selected by default |
| `x-usePkce` | Authorization code | `SHA-256`, `plain`, or `no` |
| `x-tokenName` | OAuth flows | Field name to read the access token from in the token response |
| `x-scalar-credentials-location` | Non-implicit flows | Send client credentials in the `header` or `body` |
| `x-scalar-security-query` | Authorize requests | Extra query parameters to include on the authorize request |
| `x-scalar-security-body` | Token requests | Extra body parameters to include on the token request |

See the [OpenAPI extensions reference](../../openapi.md) for more details.
