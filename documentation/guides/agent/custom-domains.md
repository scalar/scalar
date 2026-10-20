# MCP Custom Domains

Serve your hosted MCP server at a subdomain you own, such as `https://mcp.example.com/`. The custom address reaches the same server, environments, tools, and authorization settings as its Scalar address.

This is separate from a published docs site's `https://docs.example.com/mcp` endpoint. To configure a documentation site's domain, see [Docs domains](../docs/configuration/domains.md).

## Connect a domain

You need access to your DNS provider and permission to edit the MCP server. Use a subdomain that is not already assigned to another MCP server or Scalar docs site.

1. Open your MCP server in the [Scalar Dashboard](https://dashboard.scalar.com).
2. In the overview's **Configure** section, open **Custom domain**.
3. Enter `mcp.example.com` and continue.
4. At your DNS provider, add the CNAME record displayed by Scalar:

   | Type  | Host                                                     | Target           |
   | ----- | -------------------------------------------------------- | ---------------- |
   | CNAME | `mcp` (or `mcp.example.com`, depending on your provider) | `mcp.scalar.com` |

5. Wait for the dashboard to report that the domain is active. Scalar checks DNS and provisions the HTTPS certificate after the record resolves.

Use the target shown in your dashboard. Enter only the hostname in the domain field, without a path. The setup requires a CNAME, so use a subdomain rather than an apex domain such as `example.com`.

## Connection URLs

Copy the connection URL for the environment you intend to share. A production environment uses the root address; a different environment can be selected with `?env=`:

| Target                         | Example                                  |
| ------------------------------ | ---------------------------------------- |
| Production                     | `https://mcp.example.com/`               |
| Staging                        | `https://mcp.example.com/?env=staging`   |
| A published production version | `https://mcp.example.com/@1.2.0`         |
| A published staging version    | `https://mcp.example.com/@1.2.0-staging` |

The environment and version must exist on the server. A server with only one non-production environment also resolves its root to that environment; prefer the explicit environment URL so adding another environment does not change what your clients request.

For an OAuth-capable MCP client, add the URL and complete sign-in when prompted. For example:

```bash
claude mcp add --transport http payments https://mcp.example.com/
```

This command configures the connection address; authentication still depends on the server's [authorization settings](authentication/index.md).

## OAuth on your domain

An OAuth Gated server challenges unauthenticated MCP requests with `401` and a `WWW-Authenticate` header pointing to discovery metadata on the address the client used. At the root address, inspect the metadata with:

```bash
curl https://mcp.example.com/.well-known/oauth-protected-resource
```

Changing the hostname does not bypass access groups or expose stored credentials. For OAuth passthrough, ensure your upstream authorization server accepts the custom URL as a resource if it requires resources to be registered. See [OAuth passthrough](authentication/oauth-passthrough.md).

## Troubleshooting

- **Domain already taken:** choose another subdomain or release the existing assignment. A hostname cannot serve both a Scalar docs site and an MCP server.
- **DNS pending or misconfigured:** compare the host and target with the dashboard's record. Check for conflicting DNS records and allow time for propagation. If your DNS provider proxies the record, use DNS-only mode so Scalar can verify the CNAME.
- **Certificate pending:** after DNS resolves, certificate provisioning can take additional time. Wait for active status before distributing the address. Contact support if provisioning fails.
- **Sign-in unavailable:** enable at least one reader sign-in method for your team and check that the reader belongs to an allowed access group.
- **Unknown environment or version:** copy a connection URL from the dashboard for an environment and published version that exist.
- **Too many requests:** a `429` indicates rate limiting. Reduce concurrent calls and back off before retrying; see [MCP rate limiting](mcp.md#rate-limiting-and-abuse-protection).

Opening the address in a browser shows a connection page. To verify the MCP connection itself, use an MCP client and list or call its tools after authenticating.

## Release or replace a domain

Open the MCP server's **Settings** and release its custom domain. Clients using that domain will no longer connect through it. Update client configurations before removing a live domain, then configure the replacement and its DNS record.

## Related

- [MCP Servers](mcp.md)
- [Private access for customers](authentication/customer-access.md)
- [Docs domains](../docs/configuration/domains.md)
