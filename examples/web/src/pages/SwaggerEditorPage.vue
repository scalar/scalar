<script setup lang="ts">
import { SwaggerEditor } from '@scalar/swagger-editor'
import { useCodeMirror } from '@scalar/use-codemirror'

const { codeMirrorRef } = useCodeMirror({
  onUpdate: (v) => {
    console.log('change', v.state.doc.toString())
  },
})
</script>

<template>
  <SwaggerEditor>
    <template #swagger-editor><div ref="codeMirrorRef" /></template>
  </SwaggerEditor>
</template>
