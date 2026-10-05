# OAuth Passthrough

Use **OAuth passthrough** when your API has its own OAuth authorization server and every caller should act as themselves. MCP clients sign in with _your_ authorization server instead of Scalar's, and Scalar forwards the token they receive to your API on every request, exactly as it arrived. Scalar never stores the token and leaves validating it to your API.

It is the OAuth counterpart of [passthrough auth](./public-passthrough.md). Instead of pasting an API key into their client configuration, users go through the sign-in they already know, and your authorization server decides who gets in.

## How it works

An MCP client connecting to the installation runs the standard [MCP authorization](https://modelcontextprotocol.io/specification/latest/basic/authorization) flow. From the client's side, the only difference is where it is sent to sign in:

1. The client calls the MCP server without a token and gets a `401` whose `WWW-Authenticate` header points at the installation's protected resource metadata.
2. That metadata document ([RFC 9728](https://www.rfc-editor.org/rfc/rfc9728)) names your authorization server in `authorization_servers`. When you configured scopes, it lists them in `scopes_supported`.
3. The client reads your authorization server's metadata, registers itself, opens a browser for the user to sign in, and receives an access token.
4. The client sends that token as `Authorization: Bearer …` on every MCP request. Scalar lets the request through and, for each tool call, forwards the same header to your API.
5. Your API validates the token as it would for any other client.

Scalar's own sign-in—Personal Access Tokens, email codes, SSO, [access groups and login portals](./customer-access.md)—plays no part. An installation in this mode is **public** on the Scalar side, and your authorization server alone controls access.

### Your API is the gate

This mode makes the MCP server a relay. The MCP specification expects an MCP server to check that a token was issued for it and never to pass that token on to another API; [MCP OAuth](/learn/mcp/mcp-oauth) explains why. In this mode Scalar checks only that a bearer token is present, so even a made-up one reaches your API. Audience, expiry and scope are enforced by your API alone, so use this mode only when your API already validates every token it receives.

## What your authorization server needs

Clients find and use your authorization server on their own, so it has to meet what the MCP specification expects:

- **An `https` issuer that publishes metadata.** Clients fetch `/.well-known/oauth-authorization-server` ([RFC 8414](https://www.rfc-editor.org/rfc/rfc8414)) or OpenID Connect discovery from the issuer. Enter the issuer exactly as its metadata states it: clients compare the two byte for byte, so a missing path segment or trailing slash breaks discovery. An authorization server on `http://localhost` cannot be saved, so test local setups through a tunnel or a staging host.
- **The authorization code flow with PKCE.** Advertise `code_challenge_methods_supported` with `S256`. Clients refuse to continue when it is missing, even if the server supports PKCE.
- **Client registration.** Claude.ai, Cursor, Claude Code and most other clients register themselves through [dynamic client registration](https://www.rfc-editor.org/rfc/rfc7591) or a client ID metadata document, and register their own redirect URIs as they do. Many identity providers ship with dynamic client registration turned off, so check that it is enabled. Without either, only clients that accept a client ID you created by hand can connect (see [Connect a client](#connect-a-client)).
- **Tokens your API accepts.** Clients ask for a token with the `resource` parameter ([RFC 8707](https://www.rfc-editor.org/rfc/rfc8707)) set to the installation URL exactly as they call it, query string included, and name no other audience. An authorization server that honors `resource` issues a token whose audience is that URL, so your API has to accept that audience as well as its own. One that ignores `resource` issues its default token, which has to be one your API accepts.

Each address of an installation is a separate resource with its own metadata document: `https://mcp.scalar.com/mcp/YOUR_INSTALL_ID`, the readable address the dashboard hands out (such as `https://mcp.scalar.com/@acme/payments`, which can carry `?env=` or an `@1.2.0` version suffix), and a custom domain. If your authorization server only accepts registered resources, register every address your users connect with.

## Set it up

1. In the [Scalar Dashboard](https://dashboard.scalar.com), open your MCP server and select the installation (the dashboard calls it an _environment_).
2. Under **Upstream authentication**, select **Configure** for the API.
3. Choose **OAuth passthrough** as the mode.
4. Enter the **authorization server**: the issuer URL, `https` only. The field is prefilled from the API description when it can be—from an `openIdConnect` security scheme's discovery URL, or from the origin of an `oauth2` scheme's authorization URL, which is only a guess. Check it against your server's metadata either way.
5. Optionally list the **scopes** clients should request, separated by spaces. When the server was prefilled from an `oauth2` scheme, the scopes of its authorization code flow are prefilled too. The `401` names no scopes, so clients request exactly what you list here, and nothing when the list is empty. If your authorization server only issues a token your API accepts when a scope is requested, list that scope.
6. Save. If the installation was private, saving makes it public in the same step; the dialog warns you first.

### More than one API on the installation

Each API linked to the installation has its own upstream auth, and the modes can be mixed: an API in global mode keeps using its stored credential next to one in OAuth passthrough. But one MCP endpoint can send clients to only one place to sign in, so every API in OAuth passthrough mode has to name the same authorization server (the form starts from the one already in use), and clients see their scopes merged. An API in [passthrough mode](./public-passthrough.md) on the same installation can forward other headers, but not `Authorization`, since that header now carries the OAuth token.

To move to a different authorization server, switch all but one of the OAuth passthrough APIs to another mode, change the server on the remaining one, then switch the others back. Need a different authorization server per API? Put each API on its own MCP server: every environment of a server serves all of its linked APIs, so a second environment does not separate them.

## Connect a client

Hand out the installation URL with no header. The client discovers your authorization server from the `401` and signs the user in; the install snippets in the dashboard already leave the `Authorization` header out for an installation in this mode.

With Claude Code:

```bash
claude mcp add --transport http YOUR_MCP_SERVER_NAME https://mcp.scalar.com/mcp/YOUR_INSTALL_ID
```

Then run `/mcp` in Claude Code and choose **Authenticate** for the server, or run `claude mcp login YOUR_MCP_SERVER_NAME`. A browser opens on your authorization server's sign-in page.

If your authorization server does not support client registration, create a client for Claude Code on it yourself and pass its ID, with a fixed callback port, when adding the server:

```bash
claude mcp add --transport http --client-id YOUR_CLIENT_ID --callback-port 8080 YOUR_MCP_SERVER_NAME https://mcp.scalar.com/mcp/YOUR_INSTALL_ID
```

Register `http://localhost:8080/callback` as the client's redirect URI, using the port you pass to `--callback-port`. Without the flag, Claude Code picks a random port on each sign-in, and no registered redirect URI matches it. Add `--client-secret` for a confidential client; Claude Code prompts for the secret instead of taking it on the command line. Other clients use their own redirect URIs, so register those as each client documents.

### Check what clients see

```bash
curl -i https://mcp.scalar.com/mcp/YOUR_INSTALL_ID
```

The response is a `401` with a `WWW-Authenticate` header carrying a `resource_metadata` URL. Only `Authorization: Bearer …` counts as a token, so any other scheme gets the same `401`. A browser opening the URL gets a page with setup instructions instead. Fetch the metadata document:

```bash
curl https://mcp.scalar.com/.well-known/oauth-protected-resource/mcp/YOUR_INSTALL_ID
```

`authorization_servers` should list your issuer, and `scopes_supported` your scopes when you configured any. If `authorization_servers` lists `https://mcp.scalar.com` instead, either no API on the installation is saved in OAuth passthrough mode or the installation is private (see below).

## What Scalar forwards

- For an API in OAuth passthrough mode, Scalar forwards the incoming `Authorization` header and nothing else. No credential stored on the installation is used for that API.
- Scalar does not validate the token against your authorization server. It only checks that the token is not one of Scalar's own credentials, which are never forwarded. Whether it is valid, expired, or has the right scopes is your API's decision, and your API's response is what the tool returns.
- A team member who connects with a Personal Access Token still reaches the server, but Scalar forwards no token for them, so their tool calls reach your API without one.
- If your API echoes the token back in a response, Scalar redacts it from the tool result before the model sees it.

## Good to know

- **Public installations only.** A private installation uses the `Authorization` header for the consumer's Scalar token, so the dashboard refuses to make an installation private while an API on it uses OAuth passthrough. Switch that API to another mode first. A docs project linked to the installation is the exception: when it goes private, it makes the installation private too. Clients are then sent to Scalar's sign-in, and tool calls reach your API without a token. To restore the mode, make the docs project public, then set the installation back to **Public**. Setting only the installation public is undone the next time the private docs project is updated.
- **Switching an installation to this mode does not sign anyone out.** A client that signed in with Scalar while the installation was private keeps its Scalar token. That token still gets it past the MCP server but is never forwarded, and the client is never sent to your authorization server. Ask existing users to clear the server's stored sign-in and authenticate again; in Claude Code, `/mcp` → **Clear authentication**, then **Authenticate**.
- **A docs chat on the same installation loses API access.** A docs project's chat calls its installation with the docs site's own Scalar token, which is never forwarded. Searching the API description keeps working, but tools that send requests reach your API without a credential. Keep the installation your docs chat uses in global mode, and create a separate installation for OAuth passthrough.
- **Expired tokens surface as tool errors.** Scalar does not validate the token, so an expired one reaches your API, and the API's error comes back as the tool result rather than as a `401` from the MCP server. Clients that refresh only when the MCP server answers `401` will not refresh on their own; the user re-authenticates in their client (in Claude Code, `/mcp` → **Re-authenticate**).
- **Access groups and login portals do not apply.** They gate Scalar's own sign-in, which this mode bypasses. Your authorization server decides who gets in.
- **Scalar's analytics cannot tell users apart.** Scalar does not identify users from the token, so calls count as anonymous consumers. Your API's own logs record who called what.

## Related

- [Authentication](./index.md) — the two layers, and the other recipes
- [Public MCP with passthrough auth](./public-passthrough.md) — forward an API key or another header instead of an OAuth token
- [One shared key for everyone](./shared-key.md) — store one credential on the installation, OAuth included
- [MCP OAuth](/learn/mcp/mcp-oauth) — how MCP clients discover and sign in with an authorization server
