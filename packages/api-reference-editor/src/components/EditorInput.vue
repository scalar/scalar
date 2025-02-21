<script setup lang="ts">
import { isJsonString } from '@scalar/oas-utils/helpers'
import { useCodeMirror, type CodeMirrorLanguage } from '@scalar/use-codemirror'
import { ref, toRef, type Ref } from 'vue'

import { UPDATE_EVENT } from '@/constants'

const props = defineProps<{
  modelValue: string
}>()

const codeMirrorRef: Ref<HTMLDivElement | null> = ref(null)

function getSyntaxHighlighting(content?: string): CodeMirrorLanguage {
  return isJsonString(content) ? 'json' : 'yaml'
}

const { setCodeMirrorContent } = useCodeMirror({
  codeMirrorRef,
  lineNumbers: true,
  content: toRef(() => props.modelValue),
  onChange: (val: string) => {
    const evt = new CustomEvent(UPDATE_EVENT, {
      bubbles: true,
      cancelable: true,
      detail: { value: val },
    })

    codeMirrorRef.value?.dispatchEvent(evt)
  },
  language: toRef(() => getSyntaxHighlighting(props.modelValue)),
})

// Expose set content for when external specs are loaded
defineExpose({
  setCodeMirrorContent,
  dispatchUpdate(val: string) {
    const evt = new CustomEvent(UPDATE_EVENT, {
      bubbles: true,
      cancelable: true,
      detail: { value: val },
    })

    codeMirrorRef.value?.dispatchEvent(evt)
  },
})
</script>

<template>
  <div
    ref="codeMirrorRef"
    class="editor-input">
    <slot></slot>
  </div>
</template>
<style scoped>
.editor-input {
  position: relative;
  flex: 1;
  overflow: auto;
}

.editor-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-top: 30px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(1px);
  z-index: 3;
}

.editor-input :deep(.cm-editor) {
  max-height: 100%;
  height: 100%;
  padding-top: 3px;
}

.editor-input :deep(.cm-line:first-of-type:last-of-type:has(br):before) {
  content: 'Paste your Swagger file here...';
  color: var(--theme-color-3, var(--default-theme-color-3));
  position: absolute;
  display: block;
  height: 23px;
}
</style>
