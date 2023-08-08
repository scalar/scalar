<script lang="ts" setup>
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { type Extension } from '@codemirror/state'
import {
  EditorView,
  type ViewUpdate,
  lineNumbers as lineNumbersExtension,
} from '@codemirror/view'
import { useCodeMirror } from '@scalar/use-codemirror'
import { watch } from 'vue'

import { variables } from './extensions/variables'

type Language = 'javascript' | 'json'

const props = defineProps<{
  content?: string
  readOnly?: boolean
  languages?: Language[]
  withVariables?: boolean
  lineNumbers?: boolean
}>()

const emit = defineEmits<{
  (e: 'change', value: string): void
}>()

const extensions: Extension[] = []

// CSS Class
const classes = ['scalar-api-client__codemirror']

if (props.readOnly) {
  classes.push('scalar-api-client__codemirror--read-only')
}

extensions.push(EditorView.editorAttributes.of({ class: classes.join(' ') }))

// Read only
if (props.readOnly) {
  extensions.push(EditorView.editable.of(false))
}

// Syntax highlighting
if (props.languages) {
  props.languages.forEach((language) => {
    switch (language) {
      case 'javascript':
        extensions.push(javascript())
        break
      case 'json':
        extensions.push(json())
        break
    }
  })
}

// Line numbers
if (props.lineNumbers) {
  extensions.push(lineNumbersExtension())
}

// Highlight variables
if (props.withVariables) {
  extensions.push(variables())
}

// Listen to updates
extensions.push(
  EditorView.updateListener.of((v: ViewUpdate) => {
    if (!v.docChanged) {
      return
    }

    emit('change', v.state.doc.toString())
  }),
)
const { codeMirrorRef, setCodeMirrorContent } = useCodeMirror({
  content: props.content ?? '',
  extensions,
})

watch(
  () => props.content,
  () => {
    setCodeMirrorContent(props.content ?? '')
  },
)
</script>

<template>
  <div
    ref="codeMirrorRef"
    class="scalar-api-client__codemirror__wrapper" />
</template>

<style>
/** Basics */
.scalar-api-client__codemirror__wrapper {
  width: 100%;
  display: flex;
  align-items: stretch;
}

.scalar-api-client__codemirror {
  flex-grow: 1;
  max-width: 100%;
}

.scalar-api-client__codemirror.ͼw {
  background-color: var(--scalar-api-client-background-input);
}

.scalar-api-client__codemirror--read-only.ͼw {
  background-color: var(--scalar-api-client-background-secondary);
}

/** URL input */
.scalar-api-client__url-input {
  font-weight: var(--scalar-api-client-font-semibold);
}

.scalar-api-client__url-input .cm-scroller {
  padding-left: 6px;
}

.scalar-api-client__url-input .ͼ1 .cm-scroller {
  align-items: center !important;
}

.scalar-api-client__variable {
  color: var(--scalar-api-client-color);
}
</style>
./extensions/variables
