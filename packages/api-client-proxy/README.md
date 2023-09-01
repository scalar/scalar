# Scalar API Client Proxy

The Scalar API Client Proxy redirects requests to another server to avoid CORS issues. Works well with the Scalar API Client.

## Installation

```bash
npm install @scalar/api-client-proxy
```

## Usage

Create a new Node.js project and run the following code to run your own instance:

```ts
import { createApiClientProxy } from '@scalar/api-client-proxy'

const { listen } = createApiClientProxy()

listen(5051, () => {
  console.log(`🥤 API Client Proxy listening on http://localhost:5051`)
})
```

