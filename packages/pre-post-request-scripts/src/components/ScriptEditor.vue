<script setup lang="ts">
import { javascript } from '@codemirror/lang-javascript'
import { useCodeMirror } from '@scalar/use-codemirror'
import { ref, toRef } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const codeMirrorRef = ref<HTMLDivElement | null>(null)

useCodeMirror({
  codeMirrorRef,
  content: toRef(() => props.modelValue),
  language: undefined,
  // We want to use some custom configuration for the syntax highlighting.
  extensions: [javascript()],
  lineNumbers: true,
  onChange: (value) => {
    emit('update:modelValue', value)
  },
})
</script>

<template>
  <div class="script-editor text-sm">
    <div
      ref="codeMirrorRef"
      class="editor-container" />
  </div>
</template>

<style scoped>
.script-editor {
  width: 100%;
  height: 100%;
  position: relative;
}

.editor-container {
  width: 100%;
  height: 100%;
  background: var(--scalar-background-1);
  border-radius: var(--scalar-radius);
  overflow: hidden;
  padding-left: 3px;
}

:deep(.cm-editor) {
  height: 100%;
  outline: none;
  background: var(--scalar-background-1);
}

:deep(.cm-content) {
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-small);
  padding: 8px 2px;
}

:deep(.cm-gutters) {
  border-right: none;
  color: var(--scalar-color-3);
  background: var(--scalar-background-1);
  font-size: var(--scalar-mini);
  line-height: 1.44;
}

:deep(.cm-gutters:before) {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(100% - 2px);
  height: calc(100% - 4px);
  border-radius: var(--scalar-radius) 0 0 var(--scalar-radius);
}

:deep(.cm-gutterElement) {
  font-family: var(--scalar-font-code) !important;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
}

:deep(.cm-scroller) {
  overflow: auto;
}

:deep(.cm-activeLine),
:deep(.cm-activeLineGutter) {
  background-color: var(--scalar-background-2);
}

:deep(.cm-selectionMatch),
:deep(.cm-matchingBracket) {
  border-radius: var(--scalar-radius);
  background: var(--scalar-background-4) !important;
}

:deep(.cm-tooltip) {
  background: var(--scalar-background-1) !important;
  border: 1px solid var(--scalar-border-color) !important;
  border-radius: var(--scalar-radius);
  box-shadow: var(--scalar-shadow-2);
}
</style>
