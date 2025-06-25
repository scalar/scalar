# CodeMirror Hook for Vue

[![Version](https://img.shields.io/npm/v/%40scalar/use-codemirror)](https://www.npmjs.com/package/@scalar/use-codemirror)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/use-codemirror)](https://www.npmjs.com/package/@scalar/use-codemirror)
[![License](https://img.shields.io/npm/l/%40scalar%2Fuse-codemirror)](https://www.npmjs.com/package/@scalar/use-codemirror)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

## Installation

```bash
npm install @scalar/use-codemirror
```

## Usage

```vue
<script setup>
import { useCodeMirror } from '@scalar/use-codemirror'
import { ref } from 'vue'

const editor = ref(null)

const { codeMirror, setCodeMirrorContent } = useCodeMirror({
  codeMirrorRef: editor,
  content: '{ "foo": "bar" }',
  language: 'json',
  lineNumbers: true,
  onChange: (value) => {
    console.log('Content changed:', value)
  },
})
</script>

<template>
  <div ref="editor" />
</template>
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
