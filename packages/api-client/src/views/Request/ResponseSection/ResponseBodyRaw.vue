<script lang="ts" setup>
import { ScalarCodeBlock } from '@scalar/components'
import { type CodeMirrorLanguage, useCodeMirror } from '@scalar/use-codemirror'
import { ref } from 'vue'

const props = defineProps<{
  data: any
  language?: CodeMirrorLanguage
}>()

const codeMirrorRef = ref<HTMLDivElement | null>(null)

useCodeMirror({
  codeMirrorRef,
  readOnly: true,
  lineNumbers: true,
  content: props.data,
  language: props.language,
})
</script>
<template>
  <ScalarCodeBlock
    :content="data"
    :lang="language" />
</template>
<style scoped>
:deep(.cm-editor) {
  background-color: transparent;
  font-size: var(--scalar-mini);
  outline: none;
}
:deep(.cm-gutters) {
  background-color: var(--scalar-background-1);
  border-radius: var(--scalar-radius) 0 0 var(--scalar-radius);
}
</style>
