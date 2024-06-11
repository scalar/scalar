# @scalar/build-tooling

Helpers for package management within the @scalar monorepo

By default all dependencies are externalized and we don't bundle anything for internal modules.

For deployed web apps alternative build methods should be used to provide a client bundle.

In all cases package.json files should have:

```json
"scripts": {
  "build": "scalar-build-rollup",
  "types:check": "scalar-types-check",
  "types:build": "scalar-types-build",
  "format": "scalar-format-js",
  "lint:check": "eslint .",
  "lint:fix": "eslint . --fix",
}
```

For Vue/Vite we need a different build command that leverages vite and vue-tsc:

```json
"scripts": {
  "build": "scalar-build-vite",
  "types:check": "scalar-types-check-vue",
  "types:build": "scalar-types-build-vue",
  "format": "scalar-format-js",
  "lint:check": "eslint .",
  "lint:fix": "eslint . --fix",
}
```

## Rollup

For non Vue projects we use Rollup for builds. Generally speaking rollup has better management of treeshaking.

Our rollup config support json, yaml, and css import by default.
Static files can be copied over by supplying entries to the `copy` parameter

A basic `rollup.config.ts` file looks like:

```typescript
import type { RollupOptions } from 'rollup'

import { createRollupConfig } from './src/rollup-options'

const options: RollupOptions = {
  input: ['./src/index.ts'],
  // OR for nested exports with ts support
  // input: await findEntryPoints({ allowCss: true }),
  ...createRollupConfig({
    // Needed to enable explicit typescript (which Vite does not need)
    typescript: true,
  }),
}

export default options
```

## Vite

For Vue projects we use Vite to build production code. All the same rollup options can be passed through.

A basic Vite implementation might look like:

```typescript
import {
  alias,
  createViteBuildOptions,
  findEntryPoints,
} from '@scalar/build-tooling'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Provides @ -> './src' and @test -> './test' aliases
    alias: alias(),
  },
  server: {
    port: 5000,
  },
  build: createViteBuildOptions({
    entry: await findEntryPoints({ allowCss: true }),
  }),
})
```
