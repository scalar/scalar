<script setup lang="ts">
import { isJsonString } from '@scalar/oas-utils'
import { CodeMirror, type CodeMirrorLanguage } from '@scalar/use-codemirror'
import { computed, ref } from 'vue'

import { type SwaggerEditorInputProps } from '../../types'

const props = defineProps<SwaggerEditorInputProps>()

defineEmits<{
  (e: 'contentUpdate', value: string): void
}>()

defineExpose({
  setCodeMirrorContent: (value: string) => {
    codeMirrorRef.value?.setCodeMirrorContent(value)
  },
})

const codeMirrorRef = ref<typeof CodeMirror | null>(null)

function getSyntaxHighlighting(content?: string): CodeMirrorLanguage {
  return isJsonString(content) ? 'json' : 'yaml'
}

const language = computed(() => getSyntaxHighlighting(props.value))
</script>

<template>
  <div class="swagger-editor-input">
    <CodeMirror
      ref="codeMirrorRef"
      :content="value"
      :language="language"
      lineNumbers
      @change="(value: string) => $emit('contentUpdate', value)" />
  </div>
</template>

<style>
.swagger-editor-input {
  height: 100%;
  overflow: hidden;
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.swagger-editor-input .cm-line:first-of-type:last-of-type:has(br):before {
  content: 'Paste your Swagger file here...';
  color: var(--theme-color-3, var(--default-theme-color-3));
  position: absolute;
  display: block;
  height: 23px;
}
</style>
