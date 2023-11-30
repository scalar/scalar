<script lang="ts" setup>
import { type Extension } from '@codemirror/state'
import {
  EditorView,
  lineNumbers as lineNumbersExtension,
} from '@codemirror/view'
import { toRaw, watch } from 'vue'

import { useCodeMirror } from '../../hooks'
import type { CodeMirrorLanguage } from '../../types'

const props = withDefaults(
  defineProps<{
    extensions?: Extension[]
    content?: string
    readOnly?: boolean
    language?: CodeMirrorLanguage
    languages?: CodeMirrorLanguage[]
    withVariables?: boolean
    lineNumbers?: boolean
    withoutTheme?: boolean
    disableEnter?: boolean
    forceDarkMode?: boolean
  }>(),
  {
    disableEnter: false,
    forceDarkMode: false,
  },
)

const emit = defineEmits<{
  (e: 'change', value: string): void
}>()

// CSS Class
const classes = ['scalar-codemirror']

if (props.readOnly) {
  classes.push('scalar-codemirror--read-only')
}

const getCodeMirrorExtensions = () => {
  const extensions: Extension[] = []

  extensions.push(EditorView.editorAttributes.of({ class: classes.join(' ') }))

  // Custom extensions
  if (props.extensions) {
    props.extensions.forEach((extension) => {
      extensions.push(toRaw(extension))
    })
  }

  // Line numbers
  if (props.lineNumbers) {
    extensions.push(lineNumbersExtension())
  }

  return extensions
}

const { codeMirrorRef, setCodeMirrorContent, reconfigureCodeMirror } =
  useCodeMirror({
    content: props.content ?? '',
    extensions: getCodeMirrorExtensions(),
    withoutTheme: props.withoutTheme,
    forceDarkMode: props.forceDarkMode,
    onUpdate: (v) => {
      emit('change', v.state.doc.toString())
    },
    disableEnter: props.disableEnter,
    withVariables: props.withVariables,
    language: props.language ? props.language : props.languages?.[0],
    readOnly: props.readOnly,
  })

// Content changed. Updating CodeMirror …
watch(
  () => props.content,
  () => {
    if (props.content?.length) {
      setCodeMirrorContent(props.content)
    }
  },
)

// Settings changed. Reconfiguring CodeMirror …
watch(
  [
    () => props.disableEnter,
    () => props.forceDarkMode,
    () => props.languages,
    () => props.lineNumbers,
    () => props.readOnly,
    () => props.withoutTheme,
    () => props.withVariables,
  ],
  () => {
    reconfigureCodeMirror(getCodeMirrorExtensions())
  },
)

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

/** URL input */
.scalar-api-client__url-input {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  min-height: auto;
  padding-top: 0;
}

.scalar-api-client__url-input .ͼ1 .cm-scroller {
  align-items: center !important;
}

.scalar-codemirror-variable {
  color: var(--scalar-api-client-color, var(--default-scalar-api-client-color));
}

.cm-focused {
  outline: none !important;
}
</style>
