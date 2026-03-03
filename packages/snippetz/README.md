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
import { plugins } from '@scalar/snippetz/clients'

const generator = snippetz(plugins)

const snippet = await generator.print('node', 'undici', {
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

Create a configured instance by passing a plugin set (see [Plugin loading](#plugin-loading) below), then use its methods.

### Get all plugins

```ts
import { snippetz } from '@scalar/snippetz'
import { plugins } from '@scalar/snippetz/clients'

const generator = snippetz(plugins)
const plugins = generator.plugins()

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
import { plugins } from '@scalar/snippetz/clients'

const generator = snippetz(plugins)
const hasIt = generator.hasPlugin('node', 'undici')

/* Output */

// true
```

### Plugin loading

You control what gets bundled by choosing which plugins to pass to `snippetz()`:

### Eager (all upfront)

Loads every plugin at once.

```ts
import { plugins } from '@scalar/snippetz/clients'

const generator = snippetz(plugins)
```

### Lazy (on-demand)

```ts
import { plugins } from '@scalar/snippetz/clients/lazy'

const generator = snippetz(plugins)

// generator.clients() works immediately

// await generator.print(...) loads the chosen plugin when first used
```

### Selective (small bundle)

Only selected plugins are bundled.

```ts
import { shellCurl } from '@scalar/snippetz/plugins/shell/curl'
import { jsFetch } from '@scalar/snippetz/plugins/js/fetch'

const generator = snippetz([shellCurl, jsFetch])
```

### Lean usage

You can use a single plugin to keep your bundle size small. Either pass one plugin to the instance or call the plugin’s `generate()` directly:

```ts
import { nodeUndici } from '@scalar/snippetz/plugins/node/undici'

const result = nodeUndici.generate({
  url: 'https://example.com',
})

console.log(result)

// import { request } from 'undici'
//
// const { statusCode, body } = await request(
//   'https://example.com',
// )
```

With an instance: `const generator = snippetz([nodeUndici])` then `await generator.print('node', 'undici', request)`.

## Playground

Run `pnpm dev` in this package to try Snippetz in the Vue playground.

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
