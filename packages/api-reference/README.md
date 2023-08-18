# Scalar API Reference

Generate interactive API documentations from Swagger files

## Getting Started

```bash
npm install @scalar/api-reference
```

```vue
<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import '@scalar/api-reference/style.css'
</script>

<template>
  <ApiReference />
</template>
```

## Styling

### 1) Default style

```js
import '@scalar/api-reference/style.css'
```

### 2) Variables

```
:root {
  --scalar-api-reference-font-sans: 'Comic Sans MS', 'Comic Sans', cursive;
}
```

### 3) Bring your own CSS

```js
// import '@scalar/api-reference/style.css'
```