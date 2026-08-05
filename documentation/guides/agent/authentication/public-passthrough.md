# Public MCP with Passthrough Auth

This is the simplest way to share an MCP server with everyone: make the **Scalar layer public** so anyone can connect, and use **passthrough auth** so each user authenticates with their own credentials for your API.

This is the right setup when your API already requires authentication and every caller should use their *own* key. Scalar does not gate access—your API does.

## How it works

- **Public access** means Scalar does not require a sign-in to reach the MCP server. Anyone with the URL can connect.
- **Passthrough auth** means the caller puts their API credential in a header you nominate, and Scalar forwards that header upstream on each request without storing it.

Because the server is public, you can nominate the standard `Authorization` header for the credential. On a private installation the incoming `Authorization` header carries the Scalar OAuth token, so it is reserved—there you would nominate a different header such as `X-API-Key`. Using `Authorization` for passthrough only works on a **public** MCP server.

## Set it up

1. In the [Scalar Dashboard](https://dashboard.scalar.com), go to *MCP* and create an MCP server.
2. Select the API you want to expose.
3. Set access to **Public**.
4. Set authentication to **Passthrough**.
5. Nominate the header that carries the credential, for example `Authorization`.

## Connect a client

Share the installation URL and let each user pass their own credential. With Claude Code:

```bash
claude mcp add \
  YOUR_MCP_SERVER_NAME \
  https://mcp.scalar.com/mcp/YOUR_INSTALL_ID \
  --header "Authorization: Bearer YOUR_API_CREDENTIAL" \
  --transport http
```

- `YOUR_INSTALL_ID` is generated for your MCP server.
- `YOUR_API_CREDENTIAL` is whatever your API expects—for example `Bearer super-secret-token`.

Scalar forwards only the specific header(s) you nominated. Structural and Scalar-internal headers are never forwarded upstream.

## Related

- [Authentication](./index.md) — the two layers, and the other recipes
- [Private access for customers](./customer-access.md) — gate a passthrough server to specific emails with access groups
