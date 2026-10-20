# One Shared Key for Everyone

Use a stored credential when every caller should reach your API with the same API key, bearer token, or OAuth client credentials. Scalar reads the credential on the server; callers do not receive its value.

## Set it up

1. In the [Scalar Dashboard](https://dashboard.scalar.com), open **Configuration → Environments** and add a secret for the environment you will use, such as `PAYMENTS_TOKEN`.
2. Open your MCP server, select the API and environment, and open **Configure → Authorization**.
3. Choose **OAuth Gated** if callers must sign in through Scalar, or **Passthrough** if Scalar should not require sign-in.
4. In the upstream scheme's credential field, reference `{{ secrets.PAYMENTS_TOKEN }}`. For OAuth client credentials, configure the token URL, client ID, and client secret for that flow.
5. Save your configuration and connect a client using the address shown for that environment.

A stored credential can be used without Scalar sign-in. In that case anyone who can reach the MCP endpoint can call the tools you expose with that credential. Choose OAuth Gated and attach [access groups](./customer-access.md) when only selected customers should connect.

## Per-customer keys

For different stored credentials per customer, use **Per access group auth** on one OAuth Gated server. Map each customer's access group to its secret and use `{{ group.PAYMENTS_TOKEN }}` in the upstream scheme. You do not need a separate installation for each customer. See [Private access for customers](./customer-access.md#sharing-one-server-with-many-customers).

If callers should supply their own API keys, use [passthrough auth](./public-passthrough.md).

## Related

- [Authentication](./index.md)
- [MCP configuration](../configuration.md)
