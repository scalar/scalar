<script lang="ts" setup>
import { isJsonString } from '@scalar/oas-utils/helpers'
import { type CodeMirrorLanguage, useCodeMirror } from '@scalar/use-codemirror'
import { computed, ref } from 'vue'

const props = defineProps<{
  data: string
  language: CodeMirrorLanguage
}>()

const codeMirrorRef = ref<HTMLDivElement | null>(null)

// Pretty print JSON
const responseData = computed(() => {
  const value = props.data
  // Format JSON
  if (value && isJsonString(value)) {
    return JSON.stringify(JSON.parse(value), null, 2)
  } else {
    return value
  }
})

useCodeMirror({
  codeMirrorRef,
  readOnly: true,
  lineNumbers: true,
  content: responseData,
  language: props.language,
})
</script>
<template>
  <div ref="codeMirrorRef" />
</template>
<style scoped>
:deep(.cm-editor) {
  background-color: transparent;
  font-size: var(--scalar-mini);
  outline: none;
  border-radius: var(--scalar-radius);
  border: 0.5px solid var(--scalar-border-color);
}
:deep(.cm-gutters) {
  background-color: var(--scalar-background-1);
  border-radius: var(--scalar-radius) 0 0 var(--scalar-radius);
}
</style>
