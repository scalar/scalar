# Agent

Agent adds an AI chat interface to your API reference. Users can ask questions about your API and receive contextual answers based on your OpenAPI document.

## Demo

<scalar-button
  title="Chat with Agent"
  href="https://agent.scalar.com"
  icon="phosphor/regular/chat-circle-dots">
</scalar-button>

## How It Works

1. The user opens the chat interface in your API reference.
2. On first message, your OpenAPI document is uploaded to Scalar.
3. The AI uses your document to answer questions about endpoints, parameters, authentication, and more.

## Free Limits

- 10 free messages per session
- Full chat functionality
- No API key needed

Ready to upgrade? Read more about the [pricing](./pricing.md).

## Local Development

Agent is enabled by default on `http://localhost` with 10 free messages. No configuration required.

```js
Scalar.createApiReference('#app', {
  url: '/openapi.json',
})
```

The chat icon appears in the top left corner.

## Production Deployment

Agent requires a key for production. Without a key, the button and chat interface does not appear.

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

See [How to get an Agent key](key.md).

## Disabling Agent

To disable Agent entirely (including on localhost):

```js
Scalar.createApiReference('#app', {
  agent: {
    disabled: true,
  },
})
```

## Hiding the Add API control

When you preload specific APIs (e.g. via `sources` or registry documents), you can hide the control that lets users add more APIs from the public list. Set `hideAddApi: true` in the agent config for that source:

```js
Scalar.createApiReference('#app', {
  sources: [
    {
      url: 'https://registry.scalar.com/@your-namespace/apis/your-api/latest?format=json',
      agent: {
        key: 'your-agent-scalar-key',
        hideAddApi: true,
      },
    },
  ],
})
```

Only your preloaded APIs are shown; the “+ API” button and “Add context from dozens of API’s” section are hidden.

## Configuration Reference

The `agent` configuration accepts:

| Property     | Type      | Default     | Description                                                               |
| ------------ | --------- | ----------- | ------------------------------------------------------------------------- |
| `key`        | `string`  | `undefined` | Your Agent key                                                     |
| `disabled`   | `boolean` | `false`     | Enable or disable Agent                                            |
| `hideAddApi` | `boolean` | `false`     | Hide the control to add more APIs; only preloaded/registry APIs are shown |

### Per-Source Configuration

When using multiple sources, configure Agent per source:

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
