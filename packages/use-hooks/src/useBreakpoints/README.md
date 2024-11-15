# Scalar useBreakpoints Hook

Exposes [Tailwind CSS breakpoints](https://tailwindcss.com/docs/screens) as reactive min-width media queries for use in Vue templates.

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
