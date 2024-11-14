# Scalar useColorMode Hook

A composable hook that provides color mode (dark/light) functionality.

Handles system preferences, local storage persistence, and provides methods
to toggle and set the color mode. Automatically applies appropriate CSS
classes to enable theme switching.

## Basic Usage

```vue
<script setup lang="ts">
import { useColorMode } from '@scalar/use-hooks/useColorMode'

// Watches for changes in the color mode and applies the appropriate CSS classes
useColorMode()
</script>
<template>
  <!-- Template goes here -->
</template>
```
