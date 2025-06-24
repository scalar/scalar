# Scalar for SvelteKit

A SvelteKit integration for the Scalar API Reference

## Installation

```bash
npm install @scalar/sveltekit
```

## Usage

```ts
// routes/+server.ts
import { ScalarApiReference } from '@scalar/sveltekit'
import type { RequestHandler } from './$types'

const render = ScalarApiReference({
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})

export const GET: RequestHandler = () => {
  return render()
}
```
