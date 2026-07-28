# External Access

Share an MCP server with people who are **not** on your Scalar team—your customers, partners, or a scoped set of users—without inviting them into your Scalar workspace.

This page covers who can reach a private installation, how outside users sign in, and how the server authenticates against *your* API on their behalf.

## Two layers of authentication

It helps to separate two questions that are easy to conflate:

1. **Who is allowed to connect to the MCP server?** This is Scalar-side access control (public, team, or access groups + OAuth login).
2. **How does the server call your upstream API?** This is upstream auth, configured per installation (a stored credential, or credentials passed through from the caller).

They are independent. A customer can authenticate to the server with their email while the server calls your API with a key you configured—or with a key the customer supplies. Both are covered below.

## Who can connect

Every installation is **private by default**. There are three ways a caller can be granted access:

| Access                | Who gets in                                                        | How they authenticate            |
| --------------------- | ----------------------------------------------------------------- | -------------------------------- |
| **Public**            | Anyone with the URL                                               | No auth                          |
| **Team**              | Members of the installation's owning team                         | Personal Access Token or OAuth   |
| **Access group**      | Any email/domain on the allowlist—no Scalar account required      | OAuth login (email or SSO)       |

Team members typically connect with a [Personal Access Token](./mcp.md#connect-to-your-mcp-server). External users go through **access groups**, described next.

## Access groups

An access group is an allowlist of emails and/or domains that may authenticate to an installation. Use it to give outside users access without adding them to your team.

1. In the [Scalar Dashboard](https://dashboard.scalar.com), create an access group and add the emails (e.g. `customer@acme.com`) or whole domains (e.g. `acme.com`) you want to allow.
2. Open your MCP installation and attach the access group to it.
3. Share the installation URL with those users.

When someone connects, Scalar checks their authenticated email against the group's allowed emails and domains. A match grants access; anyone not on the list is rejected. An installation can have more than one access group attached, and a group can be reused across installations.

## How external users sign in

External users never need a Personal Access Token. When their MCP client connects to a private installation, Scalar runs a standard **OAuth** flow:

1. The client opens a browser to Scalar's login page for that installation.
2. The user signs in with their **email** (one-time code) or via **SSO**, if your team has configured an identity provider.
3. Scalar verifies the email against the installation's access groups.
4. On success, the client receives an OAuth token and connects. No Scalar dashboard access is granted—only the MCP server.

This is why an installation shared this way does not leak access on its own: the URL is useless to anyone whose email is not on the allowlist.

> The email login and SSO options shown on the login page are controlled by your team's external-access settings. If email sign-in is turned off for the team and no identity provider is configured, the login page will have no way to sign in—so make sure at least one method is enabled.

## Login portals

A **login portal** customizes that OAuth login page so it looks like your product instead of a generic Scalar screen. You can set the title and description, company name and logo, favicon, theme, and links to your terms and privacy policy.

1. In the dashboard, create a login portal and set your branding.
2. Attach it to an installation.

The portal changes only the *appearance and copy* of the sign-in page—it does not change who is allowed in. Access is still governed entirely by the installation's access groups (see above). If the portal appears to "do nothing," check that the installation is private, has an access group attached, and that a sign-in method (email or SSO) is enabled for the team.

## How the server authenticates to your API

Separately from who connects, each installation decides how the MCP server authenticates against your upstream API. There are two modes, configured per API version on the installation:

- **Global** — You store one credential (OAuth, API key, or bearer token) on the installation. The server uses it for every call. Agents never see it. Best when every caller should hit your API with the *same* credentials.
- **Passthrough** — The caller supplies the credential themselves. You declare which header or query parameter carries it (for example `X-API-Key`), and Scalar forwards that value upstream on each request without storing it. Best when each user must call your API with *their own* key.

Passthrough only forwards the specific headers or query parameters you list; structural and Scalar-internal headers are never forwarded, and the incoming `Authorization` header is not passed upstream unless you explicitly opt in.

### Sharing one server with many customers

If each of your customers has their own API key, the lightest-weight setup is a **single installation in passthrough mode**:

- One installation, one URL, shared with every customer.
- Attach an access group so only your customers' emails can connect.
- Each customer configures their own API key in their MCP client, which Scalar forwards to your API per request.

If you would rather your customers never handle a key, use **global** auth with **one installation per customer**, each storing that customer's key, and attach a per-customer access group. Installations and access groups can be created programmatically through the Scalar API so you can script this per customer rather than clicking through the dashboard.

## Keeping tools up to date

When you link an API to an MCP server you can set it to track the latest published (or current) version of the OpenAPI document. In that mode the exposed tools update automatically when you publish a new version of your API—there is no need to manually refresh tools after each deploy. Pin to a specific version instead when you want changes to be deliberate.

## Current limitations

- **Custom domains are not supported for MCP servers yet.** Installations are served from Scalar's MCP endpoint by installation ID; you cannot currently serve an MCP server from your own domain (e.g. `mcp.yourcompany.com`). Custom domains are supported for hosted docs, but not for the Installation MCP.
- **A single shared URL cannot yet inject a different *stored* key per signed-in user.** To give each user their own key today, use passthrough (the user supplies the key) or one installation per user (see above). Fully dynamic per-user installations are on the roadmap.

## Related

- [MCP Servers](./mcp.md) — create a server and connect a client
- [Getting Started](./getting-started.md) — from OpenAPI to agent-ready
