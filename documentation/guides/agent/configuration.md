# MCP Configuration

Use your MCP server's **Configure** pages to select tools, authorization, and upstream settings for an API and environment. The Config editor represents these overrides as JSON or YAML. Keep secrets in the team's secret store and reference them by name.

## Environments and the secret store

Open **Configuration → Environments** in the [Scalar Dashboard](https://dashboard.scalar.com). Hosted team environments are separate from [API-client collection environments](../app/environments.md).

- Every team member can see secret names and metadata, and read variables.
- Editors can add secrets and variables, including setting a value in another environment.
- Admins can rotate or delete secrets, and update or delete existing variables.
- Stored secret values cannot be read back. Variables are plaintext and must not contain credentials.

Use the MCP environment selector to edit the intended environment. Non-production environments can inherit production settings; once you save an override, that environment uses its own value. For per-group secret mappings, clearing an override records no mapping rather than restoring production inheritance.

## Reference values

| Reference                      | Use                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `{{ secrets.PAYMENTS_TOKEN }}` | Read a stored credential in the selected environment.                                                         |
| `{{ vars.CLIENT_ID }}`         | Read a non-secret value such as an OAuth client ID or username.                                               |
| `{{ group.PAYMENTS_TOKEN }}`   | Select a stored credential for the access group that admitted the reader. Requires OAuth Gated authorization. |

For example, a bearer security scheme can reference a stored token with `x-scalar-secret-token`. This is a Config fragment to merge into an existing scheme, not a complete API description:

```json
{
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "x-scalar-secret-token": "{{ secrets.PAYMENTS_TOKEN }}"
      }
    }
  }
}
```

Client IDs and usernames accept variables or secrets. Passwords, tokens, client secrets, and refresh tokens must reference secrets, or a configured group key on an OAuth Gated environment. Do not substitute a plaintext variable into a credential field.

For per-group setup and its restrictions, see [Private access for customers](authentication/customer-access.md#sharing-one-server-with-many-customers).

## OAuth URLs

OAuth authorization, token, refresh, device-authorization, OpenID Connect discovery, and OAuth metadata URLs in Config overrides can reference variables after a literal `https://` prefix:

```text
https://{{ vars.AUTH_HOST }}/oauth/token
```

Set `AUTH_HOST` to a hostname such as `auth.example.com`, without a protocol prefix. URL fields accept variables, not secret or group references. Supply every referenced variable in the selected environment before making a request.

## Configuration limits

| Setting                                                   | Limit                                               |
| --------------------------------------------------------- | --------------------------------------------------- |
| Team environments                                         | 100                                                 |
| One API channel's Config                                  | 5 MB of serialized JSON (5 × 1,024 × 1,024 bytes)   |
| A server's environments together, including their Configs | 12 MB of serialized JSON (12 × 1,024 × 1,024 bytes) |

These limits apply to the stored Config and environment records, not the size of the original API description. If a save exceeds the limit, reduce duplicated overrides or unused configuration before saving again.

## Related

- [MCP OpenAPI Extensions](openapi-extensions.md)
- [MCP Servers](mcp.md)
- [Authentication](authentication/index.md)
- [Custom domains](custom-domains.md)
