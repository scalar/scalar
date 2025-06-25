# Scalar Build Tooling

This package provides essential build and development tools for managing packages within the scalar/scalar repository. It includes:

- Standardized build scripts for Rollup and Vite
- Type checking and building utilities
- Code formatting and linting tools
- Configurations for various build scenarios

These tools streamline the development process, ensure consistency across packages, and optimize the build output for different project types within the monorepo.

## Usage

By default, all dependencies are externalized, and we don't bundle anything for internal modules.

For deployed web applications, alternative build methods should be used to provide a complete client bundle. This ensures that all necessary dependencies are included for the end-user.

To use these build tools effectively, all package.json files should include the following scripts:

```json
"scripts": {
  "build": "scalar-build-rollup",
  "types:check": "scalar-types-check",
  "types:build": "scalar-types-build",
  "format:check": "scalar-format-check",
  "format": "scalar-format",
  "lint:check": "scalar-lint-check",
  "lint:fix": "scalar-lint-fix",
}
```

For Vite/Vue we need a different build command that uses Vite and `vue-tsc`:

```json
"scripts": {
  "build": "scalar-build-vite",
  "types:check": "scalar-types-check-vue",
  "types:build": "scalar-types-build-vue",
  "format:check": "scalar-format-check",
  "format": "scalar-format",
  "lint:check": "scalar-lint-check",
  "lint:fix": "scalar-lint-fix",
}
```

## Rollup

For non-Vue projects, we use Rollup for builds due to its superior tree-shaking capabilities. This approach optimizes our bundle size.

Our Rollup configuration provides out-of-the-box support for importing JSON, YAML, and CSS files. Additionally, you can easily copy static files by specifying entries in the `copy` parameter.

Here's an example of a basic `rollup.config.ts` file:

```typescript
import type { RollupOptions } from 'rollup'

import { createRollupConfig } from './src/rollup-options'

const options: RollupOptions = {
  // Specify the entry point(s) for your build
  input: ['./src/index.ts'],
  // Alternative: Use findEntryPoints for multiple entry points with TypeScript and CSS support
  // input: await findEntryPoints({ allowCss: true }),
  ...createRollupConfig({
    // Enable TypeScript support
    typescript: true,

    // Additional options can be added here to customize the build
  }),
}

// Export the Rollup configuration
export default options
```

## Vite

For Vue projects, we use Vite to build production code. Vite offers superior performance and a more streamlined development experience compared to traditional build tools.

While Vite uses Rollup under the hood for production builds, it provides additional optimizations and features specifically tailored for Vue projects. Most Rollup options can still be passed through, allowing for fine-grained control over the build process.

A basic Vite configuration for a Vue project might look like this:

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
