<script lang="ts" setup>
import { ScalarCodeBlockCopy } from '@scalar/components'
import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import { type CodeMirrorLanguage } from '@scalar/use-codemirror'
import * as monaco from 'monaco-editor'
import { onBeforeUnmount, onMounted, ref, shallowRef, useId } from 'vue'

const props = defineProps<{
  content: any
  language: CodeMirrorLanguage | undefined
}>()

const monacoEditorRef = ref<HTMLDivElement | null>(null)
/** Base id for the code block */
const id = useId()

const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)

onMounted(() => {
  if (!monacoEditorRef.value) {
    return
  }

  editor.value = monaco.editor.create(monacoEditorRef.value, {
    value: prettyPrintJson(props.content),
    language: props.language,
    readOnly: true,
    automaticLayout: true,
    scrollbar: {
      useShadows: false,
      verticalScrollbarSize: 5,
      horizontal: 'auto',
      horizontalSliderSize: 5,
    },
    minimap: { enabled: false },
  })

  editor.value.getAction('editor.action.formatDocument')?.run()
})

onBeforeUnmount(() => {
  editor.value?.dispose()
  editor.value = null
})
</script>
<template>
  <div class="relative grid h-[80svh]">
    <div
      :id
      ref="monacoEditorRef" />
    <ScalarCodeBlockCopy
      v-if="editor"
      :aria-controls="id"
      class="absolute top-2 right-4 opacity-100"
      :content="editor?.getValue() ?? ''" />
  </div>
</template>
