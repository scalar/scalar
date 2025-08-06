# Scalar Scripts

[![Version](https://img.shields.io/npm/v/%40scalar/scripts)](https://www.npmjs.com/package/@scalar/pre-post-request-scripts)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/scripts)](https://www.npmjs.com/package/@scalar/pre-post-request-scripts)
[![License](https://img.shields.io/npm/l/%40scalar%2Fmock-server)](https://www.npmjs.com/package/@scalar/pre-post-request-scripts)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Post-response scripts for your OpenAPI documents.

> Note: This is intended to be used as a plugin with @scalar/api-client.

## Installation

```bash
npm install @scalar/pre-post-request-scripts
```

## Usage

> ⚠️ This is not published yet, it's still work in progress.

```ts
import { createApiClientWeb } from '@scalar/api-client/layouts/Web'
import { postResponseScriptsPlugin } from '@scalar/pre-post-request-scripts'
import '@scalar/api-client/style.css'

createApiClientWeb(
  document.getElementById('app'),
  {
    proxyUrl: 'https://proxy.scalar.com',
    // Load the plugin
    plugins: [
      postResponseScriptsPlugin()
    ],
  },
)
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
