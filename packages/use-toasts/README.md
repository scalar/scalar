# Scalar useToasts()

[![Version](https://img.shields.io/npm/v/%40scalar/use-toasts)](https://www.npmjs.com/package/@scalar/use-toasts)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/use-toasts)](https://www.npmjs.com/package/@scalar/use-toasts)
[![License](https://img.shields.io/npm/l/%40scalar%2Fuse-toasts)](https://www.npmjs.com/package/@scalar/use-toasts)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/8HeZcRGPFS)

---

Scalar is an open-source API platform for teams who want beautiful developer interfaces without vendor lock-in.

- **[API References](https://scalar.com/products/api-references/getting-started)** — Interactive API documentation from OpenAPI and AsyncAPI specs.
- **[Developer Docs](https://scalar.com/products/docs/getting-started)** — Write in Markdown/MDX, generate API references, sync with two-way Git.
- **[SDK Generator](https://scalar.com/products/sdks/getting-started)** — Type-safe SDKs and CLIs in TypeScript, Python, Go, PHP, Java, and Ruby.
- **[API Client](https://scalar.com/products/api-client/getting-started)** — Open-source, offline-first Postman alternative built on OpenAPI.

20M+ monthly npm installs · 15,500+ GitHub stars · MIT licensed · [scalar.com](https://scalar.com)

---

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
