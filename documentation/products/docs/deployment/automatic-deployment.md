# Automatic Deployment

Docs can automatically publish your documentation whenever changes are merged into your default branch (usually `main`).

Enable automatic deployment and configure which branch triggers it in the [Scalar Dashboard](https://dashboard.scalar.com) under your project settings. Every time you merge changes into your default branch, your documentation will be automatically published.

If your Docs project references an OpenAPI document from the Registry, updating that Registry document also triggers the Docs project to publish again. Once your document is in the Registry, your documentation stays up to date automatically.

## Other Deployment Options

Looking for more control over your deployment process?

- [GitHub Actions](github-actions.md) - Trigger deployments based on specific events
- [Scalar CLI](cli.md) - Deploy from your terminal or any CI/CD environment
