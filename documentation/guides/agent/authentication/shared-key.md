# One Shared Key for Everyone

Use **global auth** when every caller should hit your API with the *same* credentials. You store one credential on the installation and the server uses it for every request—agents and users never see it.

## How it works

You store one credential (OAuth, API key, or bearer token) on the installation. On every call, the server authenticates to your upstream API with that stored credential. The caller never provides an API key of their own; they only need to be allowed to connect (see [Authentication](./index.md)).

## Set it up

1. In the [Scalar Dashboard](https://dashboard.scalar.com), open your MCP installation.
2. Set authentication to **Global**.
3. Store the credential the server should use—OAuth, an API key, or a bearer token.

Combine this with access control that fits your audience: keep it public for an open API, or attach an [access group](./customer-access.md) to limit who can connect.

## Per-customer keys

Global auth stores one key per installation. If you need a *different* stored key per customer, create one installation per customer, each with its own stored credential and its own access group. See [Private access for customers](./customer-access.md). If instead each customer should bring their own key, use [passthrough auth](./public-passthrough.md).

## Related

- [Authentication](./index.md) — the two layers, and the other recipes
- [Private access for customers](./customer-access.md) — gate the server with access groups and OAuth
