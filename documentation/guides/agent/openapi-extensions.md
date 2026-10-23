# MCP OpenAPI Extensions

Scalar MCP servers read a set of OpenAPI vendor extensions. They decide which operations become tools, how the server authenticates to your API, which headers it adds, which responses can be downloaded through a link, and who may connect.

Most extensions can be written in two places:

- **The API description**, so the setting travels with the API.
- **A Config**, the per-environment overrides you edit under **Configure** in your MCP server. A Config uses the same OpenAPI shape as the API description and is merged over it. See [MCP Configuration](configuration.md).

Some extensions are read from a Config only, because they name stored secrets or describe one environment.

| Extension | API description | Config | Section |
| --- | --- | --- | --- |
| `x-scalar-expose` | Root, tags, operations | Production's Config only | [Tools](#tools) |
| `x-scalar-ignore`, `x-internal` | Operations | — | [Tools](#tools) |
| `x-scalar-download` | Operations | Operations, any environment | [Downloads](#downloads) |
| `x-scalar-secret-*` | — | Security schemes | [Credentials](#credentials) |
| `x-scalar-credentials-location` | Client credentials flows | Client credentials flows | [Credentials](#credentials) |
| `x-scalar-headers` | — | Root | [Additional headers](#additional-headers) |
| `x-scalar-access` | — | Root, and on a security scheme | [Access](#access) |
| `x-scalar-customization` | — | Root | [Landing page](#landing-page) |

Values in the API description are treated as untrusted input. A literal credential in an `x-scalar-secret-*` field of the API description is never sent.

## Tools

### `x-scalar-expose`

Controls whether an operation becomes an MCP tool, and what the tool is called. It is the same extension the [SDK generator](../sdks/openapi-extensions.md) reads, so one value can serve both.

`x-scalar-expose` can sit at the document root, on an entry of `tags`, and on an operation. `true` and `false` are shorthand for `{ enabled: true }` and `{ enabled: false }`.

| Field | Where | Value | Effect |
| --- | --- | --- | --- |
| `enabled` | Root, tags, operations | `true`, `false`, or `{ mcp, sdk }` | Whether operations become tools. The object form sets MCP and SDK generation separately. |
| `name` | Root | Text | Names the API's group of tools. `info.title` is not used for this. |
| `description` | Root | Text | Describes the API's group of tools. |
| `toolMode` | Root | `direct` or `generic` | `direct` gives each enabled operation its own tool. `generic` serves operations through the shared search and execute tools instead. The default is `direct`. |
| `name` | Operations | Text | The tool's name. The default is derived from the operation's summary, or its method and path. |
| `description` | Operations | Text | The tool's description. The default is derived from the operation's summary. |
| `deprecated` | Operations | `true` or `false` | Marks the tool deprecated. |
| `deprecationMessage` | Operations | Text | Tells the model what to use instead. |

`enabled` resolves per operation, and the first value found wins: the operation's own `x-scalar-expose`, then `x-scalar-ignore` or `x-internal` on the operation, then its tags' `x-scalar-expose`, then the document root's, then the server's default. The other fields come from the operation's own `x-scalar-expose` only.

```json
{
  "openapi": "3.1.0",
  "info": { "title": "Payments API", "version": "1.0.0" },
  "x-scalar-expose": {
    "name": "payments",
    "description": "Create and look up payments.",
    "toolMode": "direct"
  },
  "tags": [{ "name": "Internal", "x-scalar-expose": false }],
  "paths": {
    "/payments": {
      "get": {
        "operationId": "listPayments",
        "summary": "List payments",
        "x-scalar-expose": {
          "name": "list_payments",
          "description": "Lists payments, newest first. Filter by status to narrow the result."
        }
      }
    },
    "/payments/{id}/refunds": {
      "post": {
        "operationId": "refundPayment",
        "summary": "Refund a payment",
        "tags": ["Internal"],
        "x-scalar-expose": true
      }
    }
  }
}
```

`refundPayment` is exposed even though its tag is not: the operation's own `x-scalar-expose` wins.

In a Config, `x-scalar-expose` is accepted in production's Config only. Tools are selected once per server version, for every environment, and a change takes effect on the next version built. Per-environment tool choices are made under **Configure → MCP Tools**; see [Tools](mcp.md#tools).

### `x-scalar-ignore` and `x-internal`

`x-scalar-ignore: true` or `x-internal: true` on an operation hides it from MCP tools, as it hides the operation from the API reference and SDKs. A tag's or the root's `x-scalar-expose` does not bring a hidden operation back. Set `x-scalar-expose` on the operation itself to serve it anyway.

Deprecation markers carry over too. `deprecated: true` or `x-scalar-stability: deprecated` marks the tool deprecated, and `x-scalar-deprecation-message` becomes its deprecation message, unless the operation's `x-scalar-expose` says otherwise.

## Downloads

A tool result has a size limit, so the MCP server offers a download link when a response is too large to return whole, or when an operation answers with a file. The link is valid for 30 minutes and runs the request again each time it is opened. It needs no credentials of its own: anyone holding it can make that call, as its caller, until it expires.

Running a request again is safe for a `GET`, so a `GET` gets a link by default. Any other method can change something, so a link opened later could undo what happened since: a `PUT` would revert a resource, and a `DELETE` would remove one created in the meantime.

### `x-scalar-download`

Set `x-scalar-download: true` on an operation that is safe to run again from a link, such as a `POST` search or report endpoint. It applies to every method except `GET`, which is linked without it.

```json
{
  "paths": {
    "/reports/search": {
      "post": {
        "operationId": "searchReports",
        "summary": "Search reports",
        "x-scalar-download": true
      }
    }
  }
}
```

Without it, a response from such an operation that is too large is returned cut short, with a note saying so, and a file it answers with is not linked. A file the API description declares as the response's media type is linked on any method, since nothing runs until the link is opened.

The flag can also be set in a Config, for one environment:

```json
{
  "paths": {
    "/reports/search": {
      "post": { "x-scalar-download": true }
    }
  }
}
```

The Config validator warns about `x-scalar-download` on a `GET`, where it changes nothing. An environment that redacts responses offers no download links, since a download is never redacted.

## Credentials

### `x-scalar-secret-*`

These fields on a security scheme in a Config tell the MCP server which credential to send. Each value is a reference, resolved when the call is made. A reference is the whole value, written as a string.

| Field | Scheme | Sends |
| --- | --- | --- |
| `x-scalar-secret-token` | `apiKey`, `http` bearer | The API key or bearer token. |
| `x-scalar-secret-username` | `http` basic | The username. |
| `x-scalar-secret-password` | `http` basic | The password. |
| `x-scalar-secret-client-id` | `oauth2`, in a flow | The OAuth client ID. |
| `x-scalar-secret-client-secret` | `oauth2`, in `flows.clientCredentials` | The OAuth client secret. |

| Reference | Resolves to | Allowed in |
| --- | --- | --- |
| `{{ secrets.NAME }}` | A secret in the team's store, for the environment | Every field |
| `{{ vars.NAME }}` | A plaintext variable in the team's store | `x-scalar-secret-username` and `x-scalar-secret-client-id` only |
| `{{ group.KEY }}` | The secret the reader's access group names for `KEY` | OAuth Gated environments; see [Private access for customers](authentication/customer-access.md#sharing-one-server-with-many-customers) |
| `{{ install.API_KEY }}`, `{{ install.ACCESS_TOKEN }}` | The token the MCP client sends, as `Authorization: Bearer`, `x-api-key` or `x-auth-token` | Environments that do not sign clients in with Scalar |
| `{{ install.OAUTH_TOKEN }}` | The access token the MCP client got from your API's OAuth sign-in | Environments in [OAuth passthrough](authentication/oauth-passthrough.md) |

```json
{
  "components": {
    "securitySchemes": {
      "apiKey": {
        "type": "apiKey",
        "in": "header",
        "name": "X-Api-Key",
        "x-scalar-secret-token": "{{ secrets.PAYMENTS_API_KEY }}"
      }
    }
  }
}
```

A scheme with no reference field forwards the caller's own credential, read from where the scheme says it travels. See [Authentication](authentication/index.md) for the recipes.

### `x-scalar-credentials-location`

In an `oauth2` scheme's `flows.clientCredentials`, says where the client ID and secret are sent to the token endpoint: `header` sends them as HTTP Basic authentication, `body` sends them as form fields.

```json
{
  "components": {
    "securitySchemes": {
      "oauth": {
        "type": "oauth2",
        "flows": {
          "clientCredentials": {
            "tokenUrl": "https://auth.example.com/oauth/token",
            "scopes": { "payments:read": "Read payments" },
            "x-scalar-secret-client-id": "{{ vars.CLIENT_ID }}",
            "x-scalar-secret-client-secret": "{{ secrets.CLIENT_SECRET }}",
            "x-scalar-credentials-location": "body"
          }
        }
      }
    }
  }
}
```

## Additional headers

### `x-scalar-headers`

Root `x-scalar-headers` in a Config adds headers to every request the MCP server makes to your API, beside the security scheme's credential. A value is text with any number of references inside it. A header whose value resolves to nothing is left off the request, and `""` removes a header that production's Config sets.

| Reference | Value |
| --- | --- |
| `{{ secrets.NAME }}`, `{{ vars.NAME }}`, `{{ group.KEY }}` | As in [Credentials](#credentials) |
| `{{ request.ip }}`, `country`, `region`, `city`, `continent`, `timezone` | What the edge knows about the MCP client's connection |
| `{{ mcp.server }}`, `environment`, `version`, `client`, `session`, `tool`, `operation` | The MCP server and the call being made |
| `{{ user.id }}` | A stable, opaque ID for the signed-in user, on OAuth Gated environments |

```json
{
  "x-scalar-headers": {
    "X-Client-Country": "{{ request.country }}",
    "X-Mcp-Tool": "{{ mcp.tool }}",
    "X-Partner-Id": "{{ vars.PARTNER_ID }}"
  }
}
```

An environment takes at most 20 additional headers, each value at most 1,024 characters. Headers that carry a credential, such as `Authorization`, and headers the MCP server or the HTTP connection sets cannot be added here: declare a credential in a security scheme. `{{ install.* }}` references are refused in a header.

## Access

### `x-scalar-access`

Root `x-scalar-access` in a Config says who may connect to an OAuth Gated environment.

| Field | Value |
| --- | --- |
| `accessGroups` | The access groups whose members may sign in |
| `loginPortal` | The login portal that brands the sign-in page |
| `groupSecrets` | Per access group, the team secret each `{{ group.KEY }}` reference sends |

On a security scheme, `x-scalar-access: true` marks an `oauth2` scheme as Scalar's own sign-in. Naming that scheme in `security` makes the environment OAuth Gated. Scalar fills in its flows, so any flows written on it are ignored. See [Private access for customers](authentication/customer-access.md) for a complete setup.

## Landing page

### `x-scalar-customization`

Root `x-scalar-customization` in a Config styles the page a browser sees at the environment's address.

| Field | Value |
| --- | --- |
| `theme` | A team theme or a Scalar preset, or `null` for the default |
| `logo` | The `http` or `https` URL of an image, or `null` for none |

```json
{
  "x-scalar-customization": {
    "theme": "purple",
    "logo": "https://example.com/logo.svg"
  }
}
```

## Related

- [MCP Configuration](configuration.md)
- [MCP Servers](mcp.md)
- [Authentication](authentication/index.md)
- [SDK OpenAPI extensions](../sdks/openapi-extensions.md)
