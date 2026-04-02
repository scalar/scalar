# Scalar API Client React

[![Version](https://img.shields.io/npm/v/%40scalar/api-client-react)](https://www.npmjs.com/package/@scalar/api-client-react)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/api-client-react)](https://www.npmjs.com/package/@scalar/api-client-react)
[![License](https://img.shields.io/npm/l/%40scalar%2Fapi-client-react)](https://www.npmjs.com/package/@scalar/api-client-react)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

## Installation

```bash
npm install @scalar/api-client-react
```

## Usage

### React

Mount the provider once around the part of your app that should be able to open the API client modal.

```tsx
import { ApiClientModalProvider } from '@scalar/api-client-react'
import '@scalar/api-client-react/style.css'

export const App = ({ children }) => (
  <ApiClientModalProvider
    configuration={{
      url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
    }}>
    {children}
  </ApiClientModalProvider>
)
```

Then open the modal anywhere inside that provider with `useApiClientModal()`.

```tsx
import { useApiClientModal } from '@scalar/api-client-react'

export const OpenClientButton = () => {
  const client = useApiClientModal()

  return (
    <button onClick={() => client?.open({ path: '/auth/token', method: 'GET' })}>
      Open API Client
    </button>
  )
}
```

### Next.js (App Router)

Use a client component wrapper for the provider:

```tsx
'use client'

import { ApiClientModalProvider } from '@scalar/api-client-react'
import '@scalar/api-client-react/style.css'

export const ApiClientProvider = ({ children }) => (
  <ApiClientModalProvider
    configuration={{
      url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
    }}>
    {children}
  </ApiClientModalProvider>
)
```

The hook works in client components and accepts uppercase or lowercase HTTP methods.

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
