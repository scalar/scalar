<script lang="ts" setup>
import { ScalarCodeBlockCopy } from '@scalar/components'
import { useCodeMirror, type CodeMirrorLanguage } from '@scalar/use-codemirror'
import { applyEdits, format } from 'jsonc-parser'
import { computed, ref, toRef, useId } from 'vue'

const props = defineProps<{
  content: any
  language: CodeMirrorLanguage | undefined
}>()

const codeMirrorRef = ref<HTMLDivElement | null>(null)
/** Base id for the code block */
const id = useId()

/** Text-based format avoids JSON.parse/stringify so large integers keep full precision; aligns with JSONC in CodeMirror JSON mode. */
const jsoncFormatOptions = {
  tabSize: 2,
  insertSpaces: true,
  eol: '\n',
} as const

const prettyPrintedContent = computed(() => {
  if (props.language === 'json' && typeof props.content === 'string') {
    try {
      const edits = format(props.content, undefined, jsoncFormatOptions)
      if (edits.length > 0) {
        return applyEdits(props.content, edits)
      }
    } catch {
      // applyEdits can throw on malformed edit sequences
    }
  }
  return props.content
})

const { codeMirror } = useCodeMirror({
  codeMirrorRef,
  readOnly: true,
  lineNumbers: true,
  content: toRef(() => prettyPrintedContent.value),
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
    class="scalar-code-block group/code-block body-raw relative grid min-h-0 overflow-hidden p-px outline-none has-focus-visible:outline">
    <div
      class="body-raw-scroller custom-scroll relative pr-1"
      tabindex="0">
      <!-- CodeMirror container -->
      <div ref="codeMirrorRef" />
    </div>
    <!-- Copy button -->
    <ScalarCodeBlockCopy
      v-if="getCurrentContent()"
      :aria-controls="id"
      class="absolute top-2 right-2"
      :content="getCurrentContent()" />
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
</style>
