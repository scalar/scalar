# Scalar's Component Library

Scalars internal component library now open sourced and [almost] ready to use! it's besed used with our themeing library OR if you want you can simply set the css vars yourself. Refer to the variable legend below. This project is still very early!

## Install

```bash
pnpm i @scalar/theme @scalar/components
```

## Usage

In your main setup file (main.ts etc)

```ts
import '@scalar/themes/base.css'
import '@scalar/themes/fonts.css'
```

Then to use the components

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

This package exports its' tailwind styles in the following CSS cascade layers to make them easy to overwrite.

- `scalar-base`: reset and normalize
- `scalar-components`: complex component styles
- `scalar-utilities`: utility styles like `flex`
