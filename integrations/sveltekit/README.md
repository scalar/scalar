# Scalar for SvelteKit

[![Version](https://img.shields.io/npm/v/%40scalar/sveltekit)](https://www.npmjs.com/package/@scalar/sveltekit)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/sveltekit)](https://www.npmjs.com/package/@scalar/sveltekit)
[![License](https://img.shields.io/npm/l/%40scalar%2Fsveltekit)](https://www.npmjs.com/package/@scalar/sveltekit)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

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

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
