# Agent Scalar

Agent Scalar adds an AI chat interface to your API reference. Users can ask questions about your API and receive contextual answers based on your OpenAPI document.

## How It Works

1. User opens the chat interface in your API reference
2. On first message, your OpenAPI document is uploaded to Scalar
3. The AI uses your document to answer questions about endpoints, parameters, authentication, and more

## Local Development

Agent Scalar is enabled by default on `http://localhost` with 10 free messages. No configuration required.

```js
Scalar.createApiReference('#app', {
  url: '/openapi.json',
})
```

The chat icon appears in the top left corner.

## Production Deployment

Agent Scalar requires a key for production. Without a key, the button and chat interface does not appear.

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

See [How to get an Agent Scalar key](key.md).

## Disabling Agent Scalar

To disable Agent Scalar entirely (including on localhost):

```js
Scalar.createApiReference('#app', {
  agent: {
    disabled: true,
  },
})
```

## Configuration Reference

The `agent` configuration accepts:

| Property  | Type      | Default     | Description                    |
| --------- | --------- | ----------- | ------------------------------ |
| `key`     | `string`  | `undefined` | Your Agent Scalar API key      |
| `disabled`| `boolean` | `false`     | Enable or disable Agent Scalar |

### Per-Source Configuration

When using multiple sources, configure Agent Scalar per source:

```js
Scalar.createApiReference('#app', {
  sources: [
    {
      url: 'https://registry.scalar.com/@your-namespace/apis/first-api/latest?format=json',
      agent: {
        key: 'key-for-first-api',
      },
    },
    {
      url: 'https://registry.scalar.com/@your-namespace/apis/second-api/latest?format=json',
      agent: {
        key: 'key-for-second-api',
      },
    },
  ],
})
```

### Global Configuration

Disable globally across all sources:

```js
Scalar.createApiReference('#app', {
  agent: {
    disabled: true,
  },
  sources: [
    { url: '/api/v1/openapi.json' },
    { url: '/api/v2/openapi.json' },
  ],
})
```
