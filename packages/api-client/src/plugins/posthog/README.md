# PostHog Plugin for Scalar API Client

PostHog analytics plugin for the standalone API Client. Loading this plugin opts in to analytics.

If the plugin is not loaded, no tracking occurs.

> When using the API Reference (which embeds the API Client), use the [API Reference PostHog Plugin](../../../../api-reference/src/plugins/posthog/README.md) instead. It handles both products automatically.

## Installation

```bash
npm install posthog-js
```

## Usage

```typescript
import { PostHogClientPlugin } from '@scalar/api-client/plugins/posthog'

const plugins = [
  PostHogClientPlugin({
    apiKey: 'phc_your_project_api_key',
    apiHost: 'https://us.i.posthog.com',
  }),
]
```

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your PostHog project API key |
| `apiHost` | `string` | Yes | The PostHog API host URL |
| `uiHost` | `string` | No | The PostHog UI host URL (for session recordings, surveys, etc.) |
| `defaults` | `ConfigDefaults` | No | PostHog defaults version identifier |
