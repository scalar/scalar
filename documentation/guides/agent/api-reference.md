# Agent in Scalar API Reference

Agent can also power the **chat control inside Scalar API Reference** (the sparkle icon in the reference UI). That flow uses an **Agent key** from the Registry, separate from MCP installations.

### Free limits

- 10 free messages per session in the embedded chat
- Full chat functionality on supported hosts
- No API key required on `http://localhost`

Ready to upgrade? See <a href="./pricing.md">pricing</a>.

### Local development

Agent is enabled by default on `http://localhost` with 10 free messages. No configuration required.

```js
Scalar.createApiReference('#app', {
  url: '/openapi.json',
})
```

The chat icon appears in the top left corner.

### Production deployment

Agent requires a key for production. Without a key, the chat control does not appear.

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

See <a href="./key.md">How to get an Agent key</a>.

### Disabling Agent

To disable Agent entirely (including on localhost):

```js
Scalar.createApiReference('#app', {
  agent: {
    disabled: true,
  },
})
```

### Hiding the Add API control

When you preload specific APIs (for example via `sources` or registry documents), you can hide the control that lets users add more APIs from the public list. Set `hideAddApi: true` in the agent config for that source:

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

Only your preloaded APIs are shown; the “+ API” control and “Add context from dozens of API’s” section are hidden.

### Configuration reference

The `agent` configuration accepts:

| Property     | Type      | Default     | Description |
| ------------ | --------- | ----------- | ----------- |
| `key`        | `string`  | `undefined` | Your Agent key |
| `disabled`   | `boolean` | `false`     | Enable or disable Agent |
| `hideAddApi` | `boolean` | `false`     | Hide the control to add more APIs; only preloaded or registry APIs are shown |

**Per-source configuration** when using multiple sources:

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

**Global configuration** — disable across all sources:

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