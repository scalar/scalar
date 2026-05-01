# Authentication

To use the [Scalar CLI](getting-started.md) with Scalar services, you need to authenticate first.

## Login

```bash
scalar auth login
```

This opens the dashboard to authenticate, which is typically what you want on a local development machine.

## Login with an API Key

For CI/CD or other automated workflows, you can authenticate with an API key directly:

```bash
scalar auth login --token your-secret-scalar-api-key
```

To generate an API key, go to [https://dashboard.scalar.com](https://dashboard.scalar.com) and navigate to Account > API Keys.

## Check the Current User

```bash
scalar auth whoami
```

## Logout

```bash
scalar auth logout
```
