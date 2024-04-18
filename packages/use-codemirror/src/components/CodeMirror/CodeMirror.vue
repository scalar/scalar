<script lang="ts" setup>
import { ref, toRef } from 'vue'

import { useCodeMirror } from '../../hooks'
import type { CodeMirrorLanguage } from '../../types'

const props = withDefaults(
  defineProps<{
    content: string | undefined
    readOnly?: boolean
    language?: CodeMirrorLanguage
    withVariables?: boolean
    lineNumbers?: boolean
    withoutTheme?: boolean
    disableEnter?: boolean
  }>(),
  {
    disableEnter: false,
  },
)

const emit = defineEmits<{
  (e: 'change', value: string): void
}>()

// CSS Class
const codeMirrorRef = ref<HTMLDivElement | null>(null)

useCodeMirror({
  content: toRef(() => props.content),
  readOnly: toRef(() => props.readOnly),
  language: toRef(() => props.language),
  withVariables: toRef(() => props.withVariables),
  lineNumbers: toRef(() => props.lineNumbers),
  withoutTheme: toRef(() => props.withoutTheme),
  disableEnter: toRef(() => props.disableEnter),
  onChange: (v: string) => emit('change', v || ''),
  codeMirrorRef,
  classes: ['codemirror'],
})
</script>

<template>
  <div
    ref="codeMirrorRef"
    class="codemirror-container" />
</template>

<style scoped>
.codemirror-container {
  width: 100%;
  height: 100%;
  padding-top: 4px;
  min-height: 76px;
  background: var(--scalar-background-2);
  color: var(--scalar-color-1);
  display: flex;
  align-items: stretch;
}

.copy-to-clipboard-button {
  background: red;
}
</style>

<style>
.codemirror {
  flex-grow: 1;
  max-width: 100%;
  cursor: text;
  font-size: var(--scalar-small);
  /* Don't scale wide text on mobile because we let it scroll */
  -webkit-text-size-adjust: 100%;
}

.cm-focused {
  outline: none !important;
}
</style>
