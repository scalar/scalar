# Scalar API Reference

![Version](https://img.shields.io/npm/v/%40scalar/api-reference)
![Downloads](https://img.shields.io/npm/dm/%40scalar/api-reference)
![License](https://img.shields.io/npm/l/%40scalar%2Fapi-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/mw6FQRPh)

## Installation

```bash
npm install @scalar/api-reference
```

## Usage

```vue
<script setup>
import { ApiReference } from '@scalar/api-reference'
</script>

<template>
  <ApiReference />
</template>
```

## Props

### isEditable?: boolean

```vue
<ApiReference :isEditable="true" />
```

### spec?: string

```vue
<ApiReference spec="{ … }" />
```

### specUrl?: string

```vue
<ApiReference specUrl="/swagger.json" />
```
