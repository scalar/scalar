# Scalar's Component Library

Scalars internal component library now open sourced and [almost] ready to use! it's besed used with our themeing library OR if you want you can simply set the css vars yourself. Refer to the variable legend below. This project is still very early!

## Install

```bash
pnpm i @scalar/theme @scalar/components
```

## Usage

In your main setup file (main.ts etc)

```ts
import '@scalar/themes/fonts.css'
import '@scalar/themes/base.css'
```

Then to use the components

```vue
<script setup lang="ts">
import { ScalarButton, ScalarTextField } from '@scalar/components'
</script>

<template>
  <main class="col-1 items-center justify-center">
    <div
      class="col w-full max-w-md items-center gap-4 rounded-lg bg-back-3 p-8 shadow">
      <h1 className="text-lg font-bold">Sign in to your account</h1>

      <ScalarTextField
        class="w-full"
        label="Email Address" />
      <ScalarButton fullWidth>Login</ScalarButton>
    </div>
  </main>
</template>
```

## Theme variables

To override the theme, feel free to set the `--scalar-x` versions of these variables.

```ts
export const theme = {
  boxShadow: {
    label:
      '0 0 2px 2px var(--scalar-background-1)',
    DEFAULT: 'var(--scalar-shadow-1)',
    md: 'var(--scalar-shadow-2)',
    sm: 'rgba(0, 0, 0, 0.09) 0px 1px 4px',
    none: '0 0 #0000',
  },
  colors: {
    'fore-1': 'var(--scalar-color-1)',
    'fore-2': 'var(--scalar-color-2)',
    'fore-3': 'var(--scalar-color-3)',
    'accent': 'var(--scalar-color-accent)',
    'back-1': 'var(--scalar-background-1)',
    'back-2': 'var(--scalar-background-2)',
    'back-3': 'var(--scalar-background-3)',
    'back-accent':
      'var(--scalar-background-accent)',

    'backdrop': 'rgba(0, 0, 0, 0.44)',
    'border': 'var(--scalar-border-color)',

    'back-btn-1': 'var(--scalar-button-1)',
    'fore-btn-1':
      'var(--scalar-button-1-color)',
    'hover-btn-1':
      'var(--scalar-button-1-hover)',

    'white': '#FFF',
    'green': 'var(--scalar-color-green)',
    'red': 'var(--scalar-color-red)',
    'yellow': 'var(--scalar-color-yellow)',
    'blue': 'var(--scalar-color-blue)',
    'orange': 'var(--scalar-color-orange)',
    'purple': 'var(--scalar-color-purple)',
    'error': 'var(--scalar-error-color)',
    'ghost': 'var(--scalar-color-ghost)',
    'transparent': 'transparent',
  },
  fontSize: {
    xxs: 'var(--scalar-micro, var(--scalar-font-size-5))',
    xs: 'var(--scalar-mini, var(--scalar-font-size-4))',
    sm: 'var(--scalar-small, var(--scalar-font-size-3))',
    base: 'var(--scalar-paragraph, var(--scalar-font-size-2))',
    lg: 'var(--scalar-font-size-1)',
  },
} as const

export const extend = {
  borderRadius: {
    DEFAULT: 'var(--scalar-radius)',
    md: 'var(--scalar-radius)',
    lg: 'var(--scalar-radius-lg)',
    xl: 'var(--scalar-radius-xl)',
  },
  fontWeight: {
    medium: 'var(--scalar-font-medium)',
    bold: 'var(-scalar-font-bold)',
  },
  maxWidth: {
    'screen-xs': '480px',
    'screen-sm': '540px',
    'screen-md': '640px',
    'screen-lg': '800px',
  },
} as const
```

## Todo

- documentation
- github actions for lint, types, tests, build, npm deployment
- implementation (can remove more base style here)
- host storybook
