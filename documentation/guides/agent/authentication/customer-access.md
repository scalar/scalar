# Private Access for Customers

Share an MCP server with specific people outside your Scalar team—your customers or partners—without inviting them into your workspace. Access is gated by an allowlist, and outside users sign in with OAuth. No Scalar account required.

## Access groups

An access group is an allowlist of emails and/or domains that may authenticate to an installation.

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

A **login portal** customizes the OAuth login page so it looks like your product instead of a generic Scalar screen. You can set the title and description, company name and logo, favicon, theme, and links to your terms and privacy policy.

1. In the dashboard, create a login portal and set your branding.
2. Attach it to an installation.

The portal changes only the *appearance and copy* of the sign-in page—it does not change who is allowed in. Access is still governed entirely by the installation's access groups. If the portal appears to "do nothing," check that the installation is private, has an access group attached, and that a sign-in method (email or SSO) is enabled for the team.

## Sharing one server with many customers

If each of your customers has their own API key, pair access groups with [passthrough auth](./public-passthrough.md): one installation, one URL, shared with every customer, and each customer supplies their own key. Attach an access group so only your customers' emails can connect.

If you would rather your customers never handle a key, use [global auth](./shared-key.md) with **one installation per customer**, each storing that customer's key, and attach a per-customer access group. Installations and access groups can be created programmatically through the Scalar API, so you can script this per customer rather than clicking through the dashboard.

## Current limitations

- **Custom domains are not supported for MCP servers yet.** Installations are served from Scalar's MCP endpoint by installation ID; you cannot currently serve an MCP server from your own domain (e.g. `mcp.yourcompany.com`). Custom domains are supported for hosted docs, but not for the Installation MCP.
- **A single shared URL cannot yet inject a different *stored* key per signed-in user.** To give each user their own key today, use passthrough (the user supplies the key) or one installation per user. Fully dynamic per-user installations are on the roadmap.

## Related

- [Authentication](./index.md) — the two layers, and the other recipes
- [Public MCP with passthrough auth](./public-passthrough.md) — let each user bring their own key
- [One shared key for everyone](./shared-key.md) — store a single credential per installation
