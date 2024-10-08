<template>
  <p>import type should be removed without side-effect</p>
</template>

<script setup lang="ts">
// FIXME: @vitejs/test-dep-import-type/deep is a type only file
//        So currently it needs to be imported with `import type`
//        https://github.com/vitejs/vite-plugin-vue/issues/24
import type { Foo } from '@vitejs/test-dep-import-type/deep'

const msg: Foo = {}
</script>
