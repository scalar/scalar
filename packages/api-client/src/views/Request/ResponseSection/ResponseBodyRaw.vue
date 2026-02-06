<script lang="ts" setup>
import { ScalarCodeBlockCopy } from '@scalar/components'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import { useCodeMirror, type CodeMirrorLanguage } from '@scalar/use-codemirror'
import { ref, toRef, useId } from 'vue'

const props = defineProps<{
  content: any
  language: CodeMirrorLanguage | undefined
}>()

const codeMirrorRef = ref<HTMLDivElement | null>(null)
/** Base id for the code block */
const id = useId()

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
    class="scalar-code-block group/code-block body-raw flex min-h-0 flex-col overflow-hidden p-px outline-none has-focus-visible:outline">
    <div
      class="body-raw-scroller custom-scroll relative pr-1"
      tabindex="0">
      <!-- CodeMirror container -->
      <div ref="codeMirrorRef" />
    </div>
    <!-- Copy button -->
    <ScalarCodeBlockCopy
      v-if="getCurrentContent()"
      :content="getCurrentContent()"
      :aria-controls="id"
      :lang="language"
      class="absolute top-2 right-2" />
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
