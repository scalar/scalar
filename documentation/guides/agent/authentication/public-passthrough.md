# Public MCP with Passthrough Auth

This is the simplest way to share an MCP server with everyone: make the **Scalar layer public** so anyone can connect, and use **passthrough auth** so each user authenticates with their own credentials for your API.

This is the right setup when your API already requires authentication and every caller should use their *own* key. Scalar does not gate access—your API does. If your API uses OAuth rather than keys, [OAuth passthrough](./oauth-passthrough.md) lets users sign in with your authorization server instead.

## How it works

- **Public access** means Scalar does not require a sign-in to reach the MCP server. Anyone with the URL can connect.
- **Passthrough auth** means the caller puts their API credential in a header you nominate, and Scalar forwards that header upstream on each request without storing it.

Because the server is public, you can nominate the standard `Authorization` header for the credential. On an OAuth Gated environment the incoming `Authorization` header carries the Scalar OAuth token; configure stored upstream credentials there instead. Using `Authorization` for passthrough only works on a **public** MCP server, and not next to an API in [OAuth passthrough](./oauth-passthrough.md) mode on the same installation, which takes that header for the OAuth token.

## Set it up

1. In the [Scalar Dashboard](https://dashboard.scalar.com), open your MCP server and select the API and environment.
2. Open **Configure → Authorization** and choose **Passthrough**.
3. Select the upstream security scheme and leave its credential sourced from the caller rather than a stored secret.
4. Save the configuration and copy the environment's connection URL.

## Connect a client

Share the installation URL and let each user pass their own credential. With Claude Code:

```bash
claude mcp add \
  YOUR_MCP_SERVER_NAME \
  https://mcp.scalar.com/@YOUR_NAMESPACE/YOUR_SERVER \
  --header "Authorization: Bearer YOUR_API_CREDENTIAL" \
  --transport http
```

- Replace the example URL with the environment URL shown in your dashboard.
- Replace `YOUR_API_CREDENTIAL` with the token itself; the example already includes the `Bearer` prefix.

Scalar forwards only the specific header(s) you nominated. Structural and Scalar-internal headers are never forwarded upstream.

## Related

- [Authentication](./index.md) — the two layers, and the other recipes
- [Private access for customers](./customer-access.md) — use Scalar sign-in and stored credentials for allowed customers
- [OAuth passthrough](./oauth-passthrough.md) — let users sign in with your API's OAuth server instead of pasting a key
