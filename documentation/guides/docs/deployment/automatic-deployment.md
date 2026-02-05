# Automatic Deployment

Scalar Docs can automatically publish your documentation whenever changes are merged into your default branch (usually `main`).

You can configure which branch triggers automatic deployments in the [Scalar Dashboard](https://dashboard.scalar.com).

## Enable via Configuration

Add the following to your `scalar.config.json`:

```json
{
  "publishOnMerge": true
}
```

That's it. From now on, every time you merge changes into your default branch, your documentation will be automatically published.

## Enable via Dashboard

You can also toggle this setting in the [Scalar Dashboard](https://dashboard.scalar.com) under your project settings.

## Other Deployment Options

Looking for more control over your deployment process?

- [GitHub Actions](github-actions.md) - Trigger deployments based on specific events
- [Scalar CLI](cli.md) - Deploy from your terminal or any CI/CD environment
