# Private Access for Customers

Share an MCP server with customers or partners without inviting them into your Scalar workspace. Access groups allow specific emails or domains to sign in through OAuth. Readers do not need a Scalar account.

## Access groups

1. In the [Scalar Dashboard](https://dashboard.scalar.com), create an access group and add allowed emails, such as `customer@acme.com`, or domains, such as `acme.com`.
2. Open your MCP server and select the API and environment to configure.
3. Under **Configure → Authorization**, choose **OAuth Gated** and attach the access groups that may connect.
4. Configure stored upstream credentials for the API's authentication schemes.
5. Share the environment's connection URL.

An environment can admit multiple access groups, and a group can be reused across servers. When an email matches several groups, the first matching group in the environment's access-group order determines the group used for upstream credentials.

## How external users sign in

An unauthenticated MCP request receives a `401` challenge before the client connects, including on `initialize` and `tools/list`. An OAuth-capable client then:

1. Opens the reader sign-in page for that address.
2. Lets the reader sign in with an enabled method: email, Google, Microsoft, or reader SSO.
3. Receives a token after Scalar checks the reader against the allowed access groups.
4. Connects to the MCP server. This does not grant dashboard access.

Enable at least one reader sign-in method in your team's external-access settings. The reader page does not provide **Continue with Scalar** as a fallback. Team members can use a Personal Access Token for ordinary OAuth Gated access, subject to the group-credential restriction below.

## Login portals

A [login portal](../../login-portals.md) customizes the reader sign-in page with your company name, logo, theme, copy, and policy links. Select the portal in the environment's authorization settings.

The portal changes the sign-in page's appearance. Access groups still decide who is admitted, and your team's enabled reader methods determine how they sign in.

## Sharing one server with many customers

Use **Per access group auth** when each customer needs a different stored upstream API key:

1. Add each customer's credential as a team secret, for example `PARTNER_A_TOKEN` and `PARTNER_B_TOKEN`.
2. On the OAuth Gated environment's **Authorization** page, enable **Per access group auth**.
3. Add a shared key name, such as `PAYMENTS_TOKEN`, and map it to the appropriate secret name for each admitted group.
4. Reference `{{ group.PAYMENTS_TOKEN }}` in the upstream scheme's credential field.
5. Save and test using a reader account admitted by each group.

The corresponding access configuration fragment is:

```json
{
  "x-scalar-access": {
    "accessGroups": ["partner-a", "partner-b"],
    "groupSecrets": {
      "partner-a": { "PAYMENTS_TOKEN": "PARTNER_A_TOKEN" },
      "partner-b": { "PAYMENTS_TOKEN": "PARTNER_B_TOKEN" }
    }
  }
}
```

Merge this fragment into an existing OAuth Gated MCP Config; it does not enable OAuth Gated authorization by itself. For a bearer scheme, set its `x-scalar-secret-token` to `{{ group.PAYMENTS_TOKEN }}`. The values in `groupSecrets` are secret names, not credentials or template expressions.

A missing or empty group mapping refuses the upstream call with `credential-unavailable`. It never falls back to a shared secret. **Team-member tokens, platform tokens, and the dashboard test chat have no access group**, so they cannot make calls requiring `{{ group.KEY }}`. Test with an admitted external reader.

Other environments inherit production's group mappings until they save their own. Clearing an overridden mapping means no credential, rather than restoring inheritance. See [MCP configuration](../configuration.md).

This selects credentials per access group, not through an arbitrary per-user lookup. For callers bringing their own credentials, see [passthrough auth](./public-passthrough.md).

## Custom domains

You can serve the same MCP server from a subdomain such as `mcp.example.com`. Scalar provides OAuth discovery on that host, so readers can sign in through the custom address. Follow [MCP custom domains](../custom-domains.md) for DNS, connection URLs, and troubleshooting.

## Related

- [Authentication](./index.md)
- [One shared key for everyone](./shared-key.md)
- [MCP configuration](../configuration.md)
