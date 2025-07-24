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
    class="scalar-code-block group/code-block body-raw grid min-h-0 overflow-hidden p-px outline-none has-[:focus-visible]:outline">
    <!-- Copy button -->
    <ScalarCodeBlockCopy
      v-if="getCurrentContent()"
      :content="getCurrentContent()"
      :controls="id"
      class="z-context top-2 mr-2" />
    <div
      class="body-raw-scroller custom-scroll relative pr-1"
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
</style>
