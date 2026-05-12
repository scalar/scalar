<script lang="ts" setup>
import { ScalarCodeBlockCopy } from '@scalar/components'
import { useCodeMirror, type CodeMirrorLanguage } from '@scalar/use-codemirror'
import { computed, ref, toRef, useId } from 'vue'

import { prettifyJsoncString } from '@/v2/blocks/response-block/helpers/prettify-jsonc-string'

const props = defineProps<{
  content: unknown
  language: CodeMirrorLanguage | undefined
  /** When true, JSON/JSONC strings are pretty-printed for the Preview tab (wire bytes stay unchanged in Raw). */
  prettyPrintJson?: boolean
}>()

const codeMirrorRef = ref<HTMLDivElement | null>(null)
/** Base id for the code block */
const id = useId()

const displayContent = computed((): string => {
  const { content, language, prettyPrintJson = false } = props
  if (typeof content !== 'string') {
    if (content == null) {
      return ''
    }
    return String(content)
  }
  if (prettyPrintJson && language === 'json') {
    return prettifyJsoncString(content)
  }
  return content
})

const { codeMirror } = useCodeMirror({
  codeMirrorRef,
  readOnly: true,
  lineNumbers: true,
  content: toRef(displayContent),
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
    class="scalar-code-block group/code-block relative grid min-h-0 overflow-hidden p-px outline-none has-focus-visible:outline"
    data-testid="response-body-raw">
    <div
      class="custom-scroll relative pr-1"
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

:deep(.cm-scroller) {
  overflow: auto;
  min-width: 100%;
}
</style>
