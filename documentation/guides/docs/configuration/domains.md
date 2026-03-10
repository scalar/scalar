# Domains

Configure your documentation site's domain using either a free subdomain on `apidocumentation.com` or a custom domain. Both options are configured in the `siteConfig` object of your `scalar.config.json` file.

## Subdomain

The `subdomain` property provides a free domain at `https://<subdomain>.apidocumentation.com`. This is available for all Docs projects.

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "subdomain": "your-docs"
  }
}
```

Your documentation will be available at `https://your-docs.apidocumentation.com` after deployment.

## Custom Domain

The `customDomain` property allows you to use your own domain name. This feature requires [Scalar Pro](../../pricing.md). HTTPS is enabled automatically.

```json
// scalar.config.json
{
  "$schema": "https://registry.scalar.com/@scalar/schemas/config",
  "scalar": "2.0.0",
  "siteConfig": {
    "customDomain": "docs.example.com"
  }
}
```

### DNS Configuration

Add a CNAME record at your domain provider (Namecheap, GoDaddy, Cloudflare, etc.) pointing to Scalar's DNS:

| Type    | Host                                         | Value            |
| ------- | -------------------------------------------- | ---------------- |
| `CNAME` | `docs` (if the domain is `docs.example.com`) | `dns.scalar.com` |

The CNAME must be DNS-only (unproxied). If you use Cloudflare or a similar provider, disable the proxy (grey cloud) so the record resolves directly to Scalar. Proxying is not supported because Scalar performs load balancing, TLS termination (HTTP-01 / TLS-ALPN-01), and proxying for your docs. You cannot place your own CDN or WAF in front of the custom domain. Traffic must go directly to Scalar's infrastructure.

For a root domain (e.g., `example.com`), use an ALIAS or ANAME record if supported by your DNS provider, or contact support for assistance.

### TLS and certificates

SSL certificates are auto-provisioned by Let's Encrypt. Issuance is triggered the first time a GET request is made to your domain through Scalar's proxy. If you use CAA records, ensure they allow Let's Encrypt (see [Let's Encrypt CAA documentation](https://letsencrypt.org/docs/caa/) for details).

### Domain ownership

The first project that publishes with a custom domain and has the CNAME pointing to Scalar reserves that domain. No other user can use it. There is no TXT or other verification step. Ownership is established by publishing with the custom domain and having the CNAME in place.

### Edge security

[Google Cloud Armor](https://cloud.google.com/security/products/armor) policies are enabled on the load balancer for requests to custom-domain docs. These are volumetric, IP-based rules.

## Properties

| Property       | Type     | Required | Description                                                  |
| -------------- | -------- | -------- | ------------------------------------------------------------ |
| `subdomain`    | `string` | No       | Subdomain for `*.apidocumentation.com`                       |
| `customDomain` | `string` | No       | Custom domain name (requires [Scalar Pro](../../pricing.md)) |
