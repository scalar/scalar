# Scalar API Reference React Component

[![Version](https://img.shields.io/npm/v/%40scalar/api-reference-react)](https://www.npmjs.com/package/@scalar/api-reference-react)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/api-reference-react)](https://www.npmjs.com/package/@scalar/api-reference-react)
[![License](https://img.shields.io/npm/l/%40scalar%2Fapi-reference-react)](https://www.npmjs.com/package/@scalar/api-reference-react)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

## Installation

```bash
npm install @scalar/api-reference-react
```

## Usage

```ts
import { ApiReferenceReact } from '@scalar/api-reference-react'
import React from 'react'

function App() {
  return (
    <ApiReferenceReact
      configuration={{
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
        },
      }}
    />
  )
}

export default App
```

### Example

You can find an example in this repo under [examples/react](https://github.com/scalar/scalar/tree/main/examples/react)

## Props

ApiReference only takes one prop which is the configuration object.

### configuration: ReferenceProps

You can find the full configuration options under
[packages/api-reference](https://github.com/scalar/scalar/tree/main/packages/api-reference).
