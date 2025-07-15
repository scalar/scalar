# Scalar API Reference Web Example

This example demonstrates how to use the Scalar API Reference components in a Vue 3 application with TypeScript and Vite.

## Features

- Multiple API reference layouts (modern, classic, embedded)
- Uses the DefiLlama API specification (`spec.json`) as the example OpenAPI document
- **API Key Management**: Store and manage DefiLlama Pro API keys locally
- Editable configuration with live preview
- Dark mode support
- Path routing support
- Monaco editor integration

## API Specification

The example uses the DefiLlama API specification located in `spec.json`. This file contains a comprehensive OpenAPI 3.0 specification with:

- TVL (Total Value Locked) data endpoints
- Cryptocurrency price data
- Stablecoin information
- Yield farming data
- Volume and trading data
- Fee and revenue metrics

## API Key Integration

### DefiLlama Pro API Key

Each API reference page includes an API key input component that allows you to:

- **Store API Keys**: Securely store your DefiLlama Pro API key in localStorage
- **Auto-injection**: Automatically inject the API key into requests to `https://pro-api.llama.fi`
- **URL Format**: Keys are injected as path segments: `https://pro-api.llama.fi/{your-key}/endpoint`
- **Toggle Control**: Enable/disable API key usage with a simple toggle

### How It Works

1. **Enter API Key**: Use the API key input at the top of each page
2. **Enable/Disable**: Toggle the API key on/off as needed
3. **Auto-injection**: The system automatically detects Pro API URLs and injects your key
4. **Persistent Storage**: Your API key is stored in localStorage and persists between sessions

### Supported APIs

The API key injection works for these services:
- `https://pro-api.llama.fi` (Llama Pro)

## Available Routes

- `/` - Start page with links to all examples
- `/api-reference` - Interactive API reference with editor and API key input
- `/standalone-api-reference` - Standalone API reference with API key input
- `/path-routing/*` - Path routing example with API key input
- `/classic-api-reference` - Classic layout with API key input
- `/embedded-api-reference` - Embedded in a custom application with API key input
- `/test-api-reference/:layout/:theme` - Test different layouts and themes with API key input

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Customization

### Using Your Own OpenAPI Specification

To use your own OpenAPI specification:

1. Replace the `spec.json` file with your own OpenAPI document
2. The components will automatically use the new specification
3. Both JSON and YAML formats are supported

### Adding Custom API Key Support

To add support for additional API services:

1. Update the `API_KEY_REQUIRED_URLS` array in `src/utils/api-key-helper.ts`
2. Add the new service URL to the list
3. The system will automatically detect and inject API keys for the new service

## Type Support For `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).
