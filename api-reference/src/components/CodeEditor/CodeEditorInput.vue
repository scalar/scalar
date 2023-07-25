<script setup lang="ts">
import { type StatesArray } from '@hocuspocus/provider'

import { useSwaggerCodeEditor } from '../../hooks/useSwaggerCodeEditor'

const props = defineProps<{
  documentName?: string
  token?: string
}>()

const emit = defineEmits<{
  (e: 'awarenessUpdate', states: StatesArray): void
  (e: 'contentUpdate', value: string): void
}>()

const { codeMirrorRef, setCodeMirrorContent } = useSwaggerCodeEditor({
  documentName: props.documentName,
  token: props.token,
  onUpdate: (value) => emit('contentUpdate', value),
  onAwarenessUpdate: (states) => emit('awarenessUpdate', states),
})

defineExpose({
  setCodeMirrorContent,
})
</script>

<template>
  <div
    ref="codeMirrorRef"
    class="code-editor-input" />
</template>

<style>
.code-editor-input {
  height: 100%;
  overflow: hidden;
  border-top: var(--theme-border);
  background: var(--theme-background-2);
}

.code-editor-input .cm-editor {
  height: 100%;
}

.code-editor-input .cm-scroller {
  padding-top: 6px;
}

.code-editor-input .cm-editor .cm-line {
  padding-left: 0px !important;
}

.code-editor-input .cm-editor .cm-activeLine {
  background-color: var(--theme-background-3) !important;
}
</style>
