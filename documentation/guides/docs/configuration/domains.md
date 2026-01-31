# Domains

Configure your documentation site's domain using either a free subdomain on `apidocumentation.com` or a custom domain. Both options are configured in the `siteConfig` object of your `scalar.config.json` file.

## Subdomain

The `subdomain` property provides a free domain at `https://<subdomain>.apidocumentation.com`. This is available for all Scalar Docs projects.

```json
// scalar.config.json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "siteConfig": {
    "subdomain": "my-docs"
  }
}
```

Your documentation will be available at `https://my-docs.apidocumentation.com` after deployment.

## Custom Domain

The `customDomain` property allows you to use your own domain name. This feature requires a [Scalar subscription](https://scalar.com#pricing). Scalar automatically provisions SSL certificates and handles DNS configuration.

```json
// scalar.config.json
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
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

For a root domain (e.g., `example.com`), use an ALIAS or ANAME record if supported by your DNS provider, or contact support for assistance.

## Properties

| Property       | Type     | Required | Description                                                  |
| -------------- | -------- | -------- | ------------------------------------------------------------ |
| `subdomain`    | `string` | No       | Subdomain for `*.apidocumentation.com`                       |
| `customDomain` | `string` | No       | Custom domain name (requires [Scalar Pro](../../pricing.md)) |
