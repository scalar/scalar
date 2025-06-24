# Scalar API Reference for Vue

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
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    }" />
</template>
```
