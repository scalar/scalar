# Scalar Swagger Editor

![Version](https://img.shields.io/npm/v/%40scalar/swagger-editor)
![Downloads](https://img.shields.io/npm/dm/%40scalar/swagger-editor)
![License](https://img.shields.io/npm/l/%40scalar%2Fswagger-editor)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/mw6FQRPh)

## Installation

```bash
npm install @scalar/swagger-editor
```

## Usage

```vue
<script setup>
import { SwaggerEditor } from '@scalar/swagger-editor'
</script>

<template>
  <SwaggerEditor value="{ … }" />
</template>
```

## Custom CodeMirror extensions

You can pass custom CodeMirror extensions:

```ts
import { lineNumbers } from '@codemirror/view'
import { useSwaggerEditor } from '@scalar/swagger-editor'

const { registerExtension } = useSwaggerEditor()

registerExtension('lineNumbers', lineNumbers())
```

You can unregister the extension, too:

```ts
registerExtension('lineNumbers')
```

## Show the status bar

You can pass a text (or a Vue.js ref) to the Swagger Editor to show and fill the status bar:

```ts
import { useSwaggerEditor } from '@scalar/swagger-editor'

const { bindStatusText } = useSwaggerEditor()

bindStatusText('Hello :-)')
```
