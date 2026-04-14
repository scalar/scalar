# PostHog Plugin for Scalar API Reference

PostHog analytics plugin for the API Reference. Loading this plugin opts in to analytics for both the API Reference and the embedded API Client (tracked as separate products).

If the plugin is not loaded, no tracking occurs.

## Installation

```bash
npm install posthog-js
```

## Usage

```typescript
import { PostHogPlugin } from '@scalar/api-reference/plugins/posthog'

const configuration = {
  url: 'https://example.com/openapi.json',
  plugins: [
    PostHogPlugin({
      apiKey: 'phc_your_project_api_key',
      apiHost: 'https://us.i.posthog.com',
    }),
  ],
}
```

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your PostHog project API key |
| `apiHost` | `string` | Yes | The PostHog API host URL |
| `uiHost` | `string` | No | The PostHog UI host URL (for session recordings, surveys, etc.) |
| `defaults` | `ConfigDefaults` | No | PostHog defaults version identifier |
