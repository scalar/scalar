# Getting an Agent Scalar Key

Agent Scalar requires a key for production deployments. Keys are tied to specific OpenAPI documents in the Scalar Registry.

## Steps

1. Go to [dashboard.scalar.com/registry](https://dashboard.scalar.com/registry)
2. Upload your OpenAPI document or connect via GitHub Actions for automatic sync
3. Navigate to your document
4. Create an Agent key

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

For production, use GitHub Actions to automatically sync your OpenAPI document with the Scalar Registry. This ensures your Agent always has the latest API information.

See [GitHub Sync](../docs/github-sync.md) for setup instructions.
