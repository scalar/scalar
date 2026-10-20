# Authentication

MCP authentication answers two questions:

1. **Who can connect?** The server can accept callers without Scalar sign-in, or require an admitted Scalar token through **OAuth Gated** authorization.
2. **How does the server call your API?** It can forward the caller's credential, use a stored team secret, or select a stored secret for the caller's access group.

Configure authorization for the selected API and environment under **Configure → Authorization** in your MCP server. Environments hold settings for stages such as production and staging. Older guides and URLs may refer to an environment as an installation.

## Who can connect

With **OAuth Gated** authorization, Scalar challenges unauthenticated MCP requests immediately, including the initial connection. An OAuth-capable client starts sign-in before connecting. A team member can also use a Personal Access Token.

For customers outside your team, attach access groups that allow their emails or domains. They sign in using the reader methods your team enables: email, Google, Microsoft, or reader SSO. They do not need a Scalar account or dashboard access. The reader sign-in page does not offer **Continue with Scalar**; enable at least one reader method before sharing an OAuth login flow.

With **Passthrough** authorization, Scalar does not require its own sign-in. Your API validates the credential sent upstream. An OAuth security scheme can direct callers to your API's own authorization server instead.

## How the server authenticates to your API

| Credential source           | Behavior                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| Caller credential           | Forward the caller's credential to the upstream API.                                                 |
| Shared stored credential    | Reference a team secret so every caller uses the same upstream credential.                           |
| Per-access-group credential | On an OAuth Gated environment, select a stored secret for the access group that admitted the reader. |

OAuth Gated authorization uses the incoming bearer token for Scalar sign-in. Configure stored upstream credentials for the API schemes that require authentication. Do not use the Scalar token as your API credential.

## Pick a recipe

- [Public MCP with passthrough auth](./public-passthrough.md): callers bring their own API keys.
- [OAuth passthrough](./oauth-passthrough.md): callers sign in with your API's authorization server.
- [Private access for customers](./customer-access.md): customers sign in through Scalar access groups, optionally using a different stored API key per group.
- [One shared key for everyone](./shared-key.md): callers use the same stored upstream credential.

## Related

- [MCP Servers](../mcp.md)
- [MCP configuration](../configuration.md)
- [Custom domains](../custom-domains.md)
