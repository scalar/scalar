<script lang="ts" setup>
import { ScalarCodeBlock } from '@scalar/components'
import { isJsonString } from '@scalar/oas-utils/helpers'
import { type CodeMirrorLanguage, useCodeMirror } from '@scalar/use-codemirror'
import { computed, ref, toRaw } from 'vue'

const props = defineProps<{
  data: any
  language?: CodeMirrorLanguage
}>()

const codeMirrorRef = ref<HTMLDivElement | null>(null)

// Pretty print JSON
const content = computed<string>(() => {
  // Format JSON
  const value = props.data
  // Format JSON
  if (value && isJsonString(value)) {
    return JSON.stringify(JSON.parse(value as string), null, 2)
  } else if (value && typeof toRaw(value) === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return value
})

useCodeMirror({
  codeMirrorRef,
  readOnly: true,
  lineNumbers: true,
  content,
  language: props.language,
})
</script>
<template>
  <ScalarCodeBlock
    :content="content"
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
