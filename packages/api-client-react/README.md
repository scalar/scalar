# Scalar API Client React

[![Version](https://img.shields.io/npm/v/%40scalar/api-client-react)](https://www.npmjs.com/package/@scalar/api-client-react)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/api-client-react)](https://www.npmjs.com/package/@scalar/api-client-react)
[![License](https://img.shields.io/npm/l/%40scalar%2Fapi-client-react)](https://www.npmjs.com/package/@scalar/api-client-react)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

## Installation

```bash
npm install @scalar/api-client-react
```

## Compatibility

This package is compatible with React 19 and is untested on React 18. If you want guaranteed React 18 support please use
version `1.0.107` of this package.

## Usage

First we need to add the provider, you should add it in the highest place you have a unique spec.

```tsx
import { ApiClientModalProvider } from '@scalar/api-client-react'

import '@scalar/api-client-react/style.css'
;<ApiClientModalProvider
  configuration={{
    spec: {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    },
  }}>
  {children}
</ApiClientModalProvider>
```

Then you can trigger it from anywhere inside of that provider by calling the `useApiClientModal()`

```tsx
import { useApiClientModal } from '@scalar/api-client-react'

const client = useApiClientModal()

return (
  <button onClick={() => client?.open({ path: '/auth/token', method: 'get' })}>
    Click me to open the Api Client
  </button>
)
```

Check out the playground for a working example.

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
