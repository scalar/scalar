# Scalar useBreakpoints Hook

Exposes [Tailwind CSS breakpoints](https://tailwindcss.com/docs/screens) as reactive min-width media queries for use in Vue templates.

> [!WARNING]  
> This hook is not a replacement for Tailwind CSS breakpoints. Using breakpoints in Javascript can cause issues with Server Side Rendering (SSR) and the Tailwind CSS breakpoints should be used when possible.
>
> These breakpoints are meant to be used as an alternative when the application isn't primarily Server Side Rendered and DOM manipulation is required, e.g. an element needs to be removed from the DOM rather than just hidden with CSS / Tailwind.

Exposing the breakpoints in a hook allows us to remove the element from the DOM rather than just hiding it with CSS / Tailwind while mirroring how the tailwind breakpoints are used.

For example,`<div v-if="breakpoints.md">` will remove the element from the DOM when the screen size is less than `md` whereas `<div class="hidden md:block">` will only hide the element.

## Usage

```vue
<script setup lang="ts">
import { useBreakpoints } from '@scalar/use-hooks/useBreakpoints'

const { breakpoints } = useBreakpoints()
</script>
<template>
  <!-- Render the component only on medium screens and larger -->
  <div v-if="breakpoints.md">...</div>
</template>
```
