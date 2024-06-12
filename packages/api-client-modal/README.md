# Scalar Draggable component

[![Version](https://img.shields.io/npm/v/%40scalar/api-client-modal)](https://www.npmjs.com/package/@scalar/api-client-modal)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/api-client-modal)](https://www.npmjs.com/package/@scalar/api-client-modal)
[![License](https://img.shields.io/npm/l/%40scalar%2Fapi-client-modal)](https://www.npmjs.com/package/@scalar/api-client-modal)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

## Installation

```bash
npm install @scalar/api-client-modal
```

## Usage

```ts
import { createScalarApiClient } from '@/api-client-modal'

// Initialize
const { open } = await createScalarApiClient(document.getElementById('root'), {
  spec: {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  },
})

// Open the API client right-away
open()

// Or: Open a specific operation
// open({
//   method: 'GET',
//   path: '/me',
// })
```

You can find this example in the [playground folder](https://github.com/scalar/scalar/tree/main/packages/api-client-modal/playground).
