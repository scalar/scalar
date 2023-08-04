<script lang="ts" setup>
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { type Extension } from '@codemirror/state'
import {
  EditorView,
  lineNumbers as lineNumbersExtension,
} from '@codemirror/view'
import { watch } from 'vue'

import { useCodeMirror } from '../../hooks'
import { placeholders } from './extensions/placeholders'

type Language = 'javascript' | 'json'

const props = defineProps<{
  content?: string
  readOnly?: boolean
  languages?: Language[]
  withPlaceholders?: boolean
  lineNumbers?: boolean
}>()

const extensions: Extension[] = []

// CSS Class
extensions.push(
  EditorView.editorAttributes.of({ class: 'scalar-api-client__codemirror' }),
)

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

if (props.withPlaceholders) {
  extensions.push(placeholders())
}

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
.scalar-api-client__codemirror__wrapper {
  width: 100%;
}

.scalar-api-client__url-input {
  font-weight: var(--scalar-api-client-font-semibold);
  background: var(--scalar-api-client-background-secondary);
  color: var(--scalar-api-client-theme-color-2);
  width: 100%;
  padding: 0 12px;
  height: 30px;
  display: flex;
  align-items: center;
}
.scalar-api-client__url-input {
  max-width: calc(108vw - 208px);
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}
.scalar-api-client__url-input::-webkit-scrollbar {
  width: 0px;
  height: 0;
}
.scalar-api-client__url-input .cm-editor .cm-line {
  height: 31px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 !important;
}
.scalar-api-client__url-input .cm-editor .cm-scroller {
  background-color: transparent;
}
.scalar-api-client__url-input .cm-editor .cm-content {
  padding: 0 !important;
  font-size: var(--scalar-api-client-text-xs) !important;
}
.scalar-api-client__url-input__method {
  color: var(--scalar-api-client-color);
  border-radius: var(--scalar-api-client-rounded) !important;
  background: var(--scalar-api-client-background);
  padding: 2px;
  font: var(--scalar-api-client-font-mono);
  font-size: 11px !important;
  user-select: none;
  cursor: pointer;
}

.scalar-api-client__codemirror .cm-content *,
.scalar-api-client__codemirror .cm-content {
  font-family: var(--scalar-api-client-font-mono) !important;
  font-size: 12px;
  line-height: 1.44;
}

.scalar-api-client__codemirror .cm-scroller {
  background: var(--scalar-api-client-background-secondary);
}

.scalar-api-client__codemirror .ͼx,
.scalar-api-client__codemirror .ͼ11,
.scalar-api-client__codemirror .ͼ14,
.scalar-api-client__codemirror .ͼp {
  color: var(--scalar-api-client-color-3);
}
.scalar-api-client__codemirror {
  background-color: transparent !important;
}
.scalar-api-client__codemirror .ͼe,
.scalar-api-client__codemirror .ͼz,
.scalar-api-client__codemirror .ͼr,
.scalar-api-client__codemirror .ͼt {
  color: var(--scalar-api-client-theme-color-1);
}
.scalar-api-client__codemirror .ͼ12 {
  color: var(--scalar-api-client-theme-color-2);
}
.scalar-api-client__codemirror .ͼc,
.scalar-api-client__codemirror .ͼq {
  color: #0082d0;
}
.scalar-api-client__codemirror .ͼu {
  color: #00a67d;
}
.scalar-api-client__codemirror .cm-content {
  padding: 6px 0;
}
.scalar-api-client__codemirror .cm-line {
  padding: 0 12px;
  color: var(--scalar-api-client-color-3);
}
.scalar-api-client__codemirror .cm-matchingBracket {
  background: var(--scalar-api-client-background-3) !important;
}
.scalar-api-client__codemirror .cm-gutters {
  font-size: var(--theme-mini);
  color: var(--scalar-api-client-color-3);
  line-height: 1.44;
  background: var(--scalar-api-client-background-secondary);
  border-right-color: var(--scalar-api-client-border-color);
}
.simplecode .scalar-api-client__codemirror {
  outline: none !important;
}
.simplecode .scalar-api-client__codemirror .cm-scroller {
  background: var(--scalar-api-client-background-secondary);
  border-radius: var(--scalar-api-client-rounded);
}
.simplecode .scalar-api-client__codemirror .cm-gutters {
  display: none;
}
.scalar-api-client__codemirror .cm-gutterElement {
  font-family: var(--scalar-api-client-font-mono) !important;
}
</style>
