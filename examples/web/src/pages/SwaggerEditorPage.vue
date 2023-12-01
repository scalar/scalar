<script setup lang="ts">
import { SwaggerEditor } from '@scalar/swagger-editor'
import { useCodeMirror } from '@scalar/use-codemirror'

const { setCodeMirrorRef } = useCodeMirror({
  onUpdate: (v) => {
    console.log('change', v.state.doc.toString())
  },
})
</script>

<template>
  <SwaggerEditor :setCodeMirrorRef="setCodeMirrorRef" />
</template>
