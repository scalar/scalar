# Scalar useClipboard Hook

A hook for interacting with the clipboard.

## Copying to Clipboard

The default notification is a toast that requires `@scalar/use-toasts` to be initialized in the current project.

```vue
<script setup lang="ts">
import { useClipboard } from '@scalar/use-hooks'

const { copyToClipboard } = useClipboard()

// Text to be copied
const text = 'Hello, Scalar!'

// Optional: Custom notification function
const customNotify = (message: string) => console.log(message)

// Use custom notification
// const { copyToClipboard } = useClipboard({ notify: customNotify })
</script>

<template>
  <button @click="() => copyToClipboard(text)">
    Copy "{{ text }}" to clipboard
  </button>
</template>
```
