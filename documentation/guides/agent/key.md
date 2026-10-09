# Agent Keys

Agent requires a key for production deployments. Keys are tied to specific OpenAPI documents in the Registry.

## Steps

1. Open **APIs** in the [dashboard](https://dashboard.scalar.com/apis)
2. Upload your OpenAPI document or connect via GitHub Actions for automatic sync
3. Open your API, then its **Settings → Agent** page
4. Under **Agent keys**, click **New agent key**

## Configuration

Add the key to your API reference configuration:

```js
Scalar.createApiReference('#app', {
  sources: [
    {
      url: 'https://registry.scalar.com/@your-namespace/apis/your-api/latest?format=json',
      agent: {
        key: 'your-agent-scalar-key',
      },
    },
  ],
})
```

## Keeping Documents in Sync

For production, use [GitHub Actions](../registry/github-actions.md) to automatically sync your OpenAPI document with the Registry. This ensures your Agent always has the latest API information.
