<script lang="ts" setup>
import type { Extension } from '@codemirror/state'

import { useCodeMirror } from '../../hooks'
import type { CodeMirrorLanguage } from '../../types'

const props = defineProps<{
  extensions?: Extension[]
  content?: string
  readOnly?: boolean
  language?: CodeMirrorLanguage
  withVariables?: boolean
  lineNumbers?: boolean
  withoutTheme?: boolean
  disableEnter?: boolean
}>()

const emit = defineEmits<{
  (e: 'change', value: string): void
}>()

const { codeMirrorRef, setCodeMirrorContent } = useCodeMirror({
  extensions: props.extensions,
  content: props.content,
  readOnly: props.readOnly,
  language: props.language,
  withVariables: props.withVariables,
  lineNumbers: props.lineNumbers,
  withoutTheme: props.withoutTheme,
  disableEnter: props.disableEnter,
  onUpdate: (v) => {
    emit('change', v.state.doc.toString())
  },
})

defineExpose({
  setCodeMirrorContent,
})
</script>

<template>
  <div
    ref="codeMirrorRef"
    class="scalar-codemirror-wrapper" />
</template>

<style>
/** Basics */
.scalar-codemirror-wrapper {
  width: 100%;
  height: 100%;
  padding-top: 4px;
  min-height: 76px;
  background: var(--theme-background-2, var(--default-theme-background-2));
  color: var(--theme-color-1, var(--default-theme-color-1));
  display: flex;
  align-items: stretch;
}
.scalar-codemirror {
  flex-grow: 1;
  max-width: 100%;
  cursor: text;
  font-size: var(--theme-small, var(--default-theme-small));
}
.scalar-codemirror-variable {
  color: var(--scalar-api-client-color, var(--default-scalar-api-client-color));
}
.cm-focused {
  outline: none !important;
}
</style>
