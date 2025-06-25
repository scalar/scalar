# Scalar React Renderer

[![Version](https://img.shields.io/npm/v/%40scalar/react-renderer)](https://www.npmjs.com/package/@scalar/react-renderer)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/react-renderer)](https://www.npmjs.com/package/@scalar/react-renderer)
[![License](https://img.shields.io/npm/l/%40scalar%2Freact-renderer)](https://www.npmjs.com/package/@scalar/react-renderer)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

A Vue component to render React components inside Vue.

## Installation

```bash
npm install @scalar/react-renderer
```

## Usage

```vue
<script setup lang="ts">
import { ReactRenderer } from '@scalar/react-renderer'
import { MyReactComponent } from './components/MyReactComponent'
</script>

<template>
  <ReactRenderer :component="MyReactComponent" my-custom-prop="foobar" />
</template>

```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
