<script lang="ts" setup>
import { ScalarCodeBlockCopy } from '@scalar/components/code-block'
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarIconArrowElbowDownLeft } from '@scalar/icons'
import {
  EditorView,
  useCodeMirror,
  type CodeMirrorLanguage,
} from '@scalar/use-codemirror'
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

const isLineWrapping = ref(false)

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

const extensions = computed(() =>
  isLineWrapping.value ? [EditorView.lineWrapping] : [],
)

const { codeMirror } = useCodeMirror({
  codeMirrorRef,
  readOnly: true,
  lineNumbers: true,
  content: toRef(displayContent),
  language: toRef(() => props.language),
  forceFoldGutter: true,
  extensions,
})

// Function to get current content
const getCurrentContent = () => {
  return codeMirror.value?.state.doc.toString() || ''
}

const toggleLineWrapping = (event: MouseEvent) => {
  isLineWrapping.value = !isLineWrapping.value
  ;(event.currentTarget as HTMLElement)?.blur()
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
    <!-- Action buttons -->
    <div
      v-if="getCurrentContent()"
      class="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover/code-block:opacity-100 group-has-focus-visible/code-block:opacity-100">
      <ScalarIconButton
        class="bg-b-2 text-c-2 hover:text-c-1 absolute right-18"
        :icon="ScalarIconArrowElbowDownLeft"
        :label="isLineWrapping ? 'Disable line wrap' : 'Wrap lines'"
        size="sm"
        tooltip
        variant="ghost"
        @click="toggleLineWrapping" />
      <ScalarCodeBlockCopy
        :aria-controls="id"
        :content="getCurrentContent()" />
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

:deep(.cm-scroller) {
  overflow: auto;
  min-width: 100%;
}

:deep(.cm-lineWrapping .cm-line) {
  word-break: break-all;
}
</style>
