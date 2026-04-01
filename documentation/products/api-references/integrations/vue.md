# API Reference for Vue

## Installation

```bash
npm install @scalar/api-reference
```

## Usage

```vue
<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import '@scalar/api-reference/style.css'
</script>

<template>
  <ApiReference
    :configuration="{
      url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
    }" />
</template>
```

## Using with Tailwind CSS

If your Vue project uses Tailwind CSS v4, you need to set the CSS layer order so that Tailwind's utility classes take priority over Scalar's styles. Add this to the top of your main CSS file:

```css
@layer scalar-base, scalar-theme, scalar-config, theme, base, components, utilities;
@import "tailwindcss";
```

For full details, see [Embedding with CSS Frameworks](../themes.md#embedding-with-css-frameworks).
