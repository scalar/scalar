# Snippetz

[![Version](https://img.shields.io/npm/v/%40scalar/snippetz)](https://www.npmjs.com/package/@scalar/snippetz)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/snippetz)](https://www.npmjs.com/package/@scalar/snippetz)
[![License](https://img.shields.io/npm/l/%40scalar%2Fsnippetz)](https://www.npmjs.com/package/@scalar/snippetz)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

A modern way to generate HTTP request examples for different languages and libraries.

## Installation

```bash
npm install @scalar/snippetz
```

## Usage

```ts
import { snippetz } from '@scalar/snippetz'

const snippet = snippetz().print('node', 'undici', {
  url: 'https://example.com',
})

/* Output */

// import { request } from 'undici'
//
// const { statusCode, body } = await request(
//   'https://example.com',
// )
```

## API

### Get all plugins

```ts
import { snippetz } from '@scalar/snippetz'

const snippet = snippetz().plugins()

/* Output */

// [
//   {
//     target: 'node',
//     client: 'undici',
//   }
// ]
```

### Check if a plugin is loaded

```ts
import { snippetz } from '@scalar/snippetz'

const snippet = snippetz().hasPlugin('node', 'undici')

/* Output */

// true
```

### Lean usage

You can also just use one specific plugin to keep your bundle size small.

```ts
import { nodeUndici } from '@scalar/snippetz/plugins/node/undici'

const result = nodeUndici.generate({
  url: 'https://example.com',
})

console.log(source)

// import { request } from 'undici'

// const { statusCode, body } = await request(
//   'url': 'https://example.com',
// )
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
