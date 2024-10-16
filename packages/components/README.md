# Scalar Components

This library is designed to work seamlessly with our theming system, but it’s also flexible enough for standalone use by setting CSS variables manually. For a list of available variables, please refer to the variable legend below.

## Installation

```bash
pnpm i @scalar/components
```

## Usage

To get started, import the CSS styles in your main setup file (e.g., main.ts, index.ts, or App.vue):

```ts
import '@scalar/components/style.css'
```

Then, you can use the components in your Vue components. Here’s an example:

```vue
<script setup lang="ts">
import { ScalarButton, ScalarTextField } from '@scalar/components'
</script>

<template>
  <main class="col-1 items-center justify-center">
    <div
      class="col w-full max-w-md items-center gap-4 rounded-lg bg-b-3 p-8 shadow">
      <h1 className="text-lg font-bold">Sign in to your account</h1>

      <ScalarTextField
        class="w-full"
        label="Email Address" />
      <ScalarButton fullWidth>Login</ScalarButton>
    </div>
  </main>
</template>
```

## CSS Layers

This package exports its Tailwind styles using CSS cascade layers to avoid any conflicts with existing CSS. The layers are organized as follows:

- `scalar-base`: reset and normalize
- `scalar-components`: complex component styles
- `scalar-utilities`: utility styles like `flex`
