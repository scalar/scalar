# Scalar useToasts()

[![Version](https://img.shields.io/npm/v/%40scalar/use-toasts)](https://www.npmjs.com/package/@scalar/use-toasts)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/use-toasts)](https://www.npmjs.com/package/@scalar/use-toasts)
[![License](https://img.shields.io/npm/l/%40scalar%2Fuse-toasts)](https://www.npmjs.com/package/@scalar/use-toasts)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/8HeZcRGPFS)

## Installation

```bash
npm install @scalar/use-toasts
```

## Usage

```vue
// App.vue
<script setup>
import { ScalarToasts } from '@scalar/use-toasts'
</script>
<template>
  <ScalarToasts />
</template>
```

```vue
// ChildComponent.vue
<script setup>
import { useToasts } from '@scalar/use-toasts'

const { toast } = useToasts()

const sendMessage = () => {
  toast('This is a message from the toaster!', 'success', { timeout: 2000 })
}
</script>
```
