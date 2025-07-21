<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import { useCodeMirror, type CodeMirrorLanguage } from '@scalar/use-codemirror'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { ref, toRef } from 'vue'

const props = defineProps<{
  content: any
  language: CodeMirrorLanguage | undefined
}>()

const codeMirrorRef = ref<HTMLDivElement | null>(null)
const { copyToClipboard } = useClipboard()

const { codeMirror } = useCodeMirror({
  codeMirrorRef,
  readOnly: true,
  lineNumbers: true,
  content: toRef(() => prettyPrintJson(props.content)),
  language: toRef(() => props.language),
  forceFoldGutter: true,
})

// Function to get current content
const getCurrentContent = () => {
  return codeMirror.value?.state.doc.toString() || ''
}
</script>
<template>
  <div
    class="body-raw grid min-h-0 overflow-hidden p-px outline-none has-[:focus-visible]:outline">
    <!-- Copy button -->
    <div
      v-if="getCurrentContent()"
      class="scalar-code-copy">
      <button
        class="copy-button"
        type="button"
        @click="copyToClipboard(getCurrentContent())">
        <span class="sr-only">Copy content</span>
        <ScalarIcon
          icon="Clipboard"
          size="md" />
      </button>
    </div>
    <div
      class="body-raw-scroller relative overflow-auto overscroll-contain"
      tabindex="0">
      <!-- CodeMirror container -->
      <div ref="codeMirrorRef" />
    </div>
  </div>
</template>
<style scoped>
:deep(.cm-editor) {
  background-color: transparent;
  font-size: var(--scalar-small);
  outline: none;
}
:deep(.cm-gutters) {
  background-color: var(--scalar-background-1);
  border-radius: var(--scalar-radius) 0 0 var(--scalar-radius);
}

.body-raw :deep(.cm-scroller) {
  overflow: auto;
  min-width: 100%;
}

/* Copy Button Styles */
.scalar-code-copy {
  align-items: flex-start;
  display: flex;
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 10;
  pointer-events: none;
  position: sticky;
  transform: translateX(-6px);
}

.copy-button {
  align-items: center;
  display: flex;
  background-color: var(--scalar-background-1);
  border: 1px solid var(--scalar-border-color);
  border-radius: 3px;
  color: var(--scalar-color-3);
  cursor: pointer;
  height: 30px;
  opacity: 0;
  padding: 6px;
  pointer-events: auto;
  transition:
    opacity 0.15s ease-in-out,
    color 0.15s ease-in-out;
}

/* Show button on container hover */
.body-raw:hover .copy-button,
.copy-button:focus-visible {
  opacity: 1;
}

.copy-button:hover {
  color: var(--scalar-color-1);
}
</style>
