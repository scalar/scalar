# Authentication

An MCP server has **two independent layers of authentication**, and keeping them separate makes everything else clearer:

1. **Who is allowed to connect to the MCP server?** This is Scalar-side access control—public, your team, or an access group.
2. **How does the server call your upstream API?** This is upstream auth, configured per installation: a credential you store, or a credential the caller passes through.

They are independent. Someone can be allowed to connect (layer 1) while the server calls your API with a key you stored—or with a key they supply themselves (layer 2).

## Who can connect

Every installation is **private by default**. There are three ways a caller can be granted access:

| Access           | Who gets in                                                  | How they authenticate          |
| ---------------- | ------------------------------------------------------------ | ------------------------------ |
| **Public**       | Anyone with the URL                                          | No Scalar auth                 |
| **Team**         | Members of the installation's owning team                    | Personal Access Token or OAuth |
| **Access group** | Any email/domain on the allowlist—no Scalar account required | OAuth login (email or SSO)     |

## How the server authenticates to your API

Separately from who connects, each installation decides how it authenticates against your upstream API:

- **Global** — You store one credential on the installation and the server uses it for every call. Agents never see it.
- **Passthrough** — The caller supplies the credential, and Scalar forwards it upstream per request without storing it.

## Pick a recipe

Most setups are one of these three combinations:

- [Public MCP with passthrough auth](./public-passthrough.md) — anyone can connect, and each user authenticates with their own API credentials. The simplest way to share one MCP with the world.
- [Private access for customers](./customer-access.md) — gate the server to specific emails or domains with access groups and OAuth login, and brand the sign-in page.
- [One shared key for everyone](./shared-key.md) — store a single credential on the installation so callers never handle a key.

## Related

- [MCP Servers](../mcp.md) — create a server and connect a client
- [Getting Started](../getting-started.md) — from OpenAPI to agent-ready
