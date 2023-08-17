<script setup lang="ts">
import { type StatesArray } from '@hocuspocus/provider'
import { toRef } from 'vue'

import { useCodeMirrorForSwaggerFiles } from '../../hooks/useCodeMirrorForSwaggerFiles'

const props = defineProps<{
  documentName?: string
  token?: string
  username?: string
}>()

const emit = defineEmits<{
  (e: 'awarenessUpdate', states: StatesArray): void
  (e: 'contentUpdate', value: string): void
}>()

const documentNameRef = toRef(props, 'documentName')
const tokenRef = toRef(props, 'token')

const { codeMirrorRef, setCodeMirrorContent } = useCodeMirrorForSwaggerFiles({
  documentName: documentNameRef,
  token: tokenRef,
  username: props.username,
  onUpdate: (value) => emit('contentUpdate', value),
  onAwarenessUpdate: (states) => emit('awarenessUpdate', states),
})

defineExpose({
  setCodeMirrorContent,
})
</script>

<template>
  <div
    ref="codeMirrorRef"
    class="code-editor-input" />
</template>

<style>
.code-editor-input {
  height: 100%;
  overflow: hidden;
  border-top: var(--scalar-api-reference-border);
  background: var(--scalar-api-reference-theme-background-2);
}

.code-editor-input .cm-editor {
  height: 100%;
}

.code-editor-input .cm-scroller {
  padding-top: 6px;
}

.code-editor-input .cm-editor .cm-line {
  padding-left: 0px !important;
}

.code-editor-input .cm-editor .cm-activeLine {
  background-color: var(--scalar-api-reference-theme-background-3) !important;
}

.code-editor-input .cm-yLineSelection {
  margin: 0;
}

.light-mode .cm-editor {
  --cm-blue: #0082d0;
  --cm-green: #00a67d;
  --cm-yellow: #b29762;
}
.dark-mode .cm-editor {
  --cm-blue: #79c0ff;
  --cm-green: #7ee787;
  --cm-yellow: #e9950c;
}
.cm-editor .cm-content *,
.cm-editor .cm-content {
  font-family: var(--scalar-api-reference-theme-font-code) !important;
  font-size: var(--scalar-api-reference-theme-mini);
  line-height: 1.44;
}
.cm-editor .cm-scroller {
  background: var(--scalar-api-reference-theme-background-2);
}
.cm-editor .cm-activeLine,
.cm-editor .cm-activeLineGutter {
  background-color: transparent !important;
}

.ͼr .cm-line ::selection,
.ͼr .cm-line::selection,
.ͼ8 .cm-line ::selection,
.ͼ8 .cm-line::selection,
.ͼ1b.cm-focused .cm-selectionBackground,
.ͼ1b .cm-selectionLayer .cm-selectionBackground,
.ͼ1b .cm-content ::selection {
  background-color: inherit !important;
}
.cm-editor.cm-focused {
  outline: none !important;
}
.cm-editor {
  background-color: transparent !important;
}
.cm-editor .ͼ1e,
.cm-editor .ͼe,
.cm-editor .ͼz,
.cm-editor .ͼr,
.cm-editor .ͼ8,
.cm-editor .ͼt,
.cm-editor .ͼa {
  color: var(--scalar-api-reference-theme-color-1);
}
.cm-editor .ͼ12,
.cm-editor .ͼj {
  color: var(--scalar-api-reference-theme-color-2);
}
.cm-foldGutter span[title='Unfold line'],
.cm-foldGutter span[title='Fold line'] {
  font-size: 0px;
}
.cm-foldGutter span:after {
  width: 9px;
  height: 9px;
  display: block;
  box-shadow: 1px 1px 0 currentColor;
  transition: all 0.15s ease-in-out;
}
.cm-foldGutter span[title='Fold line']:after {
  content: '';
  transform: rotate(45deg) translate3d(-2px, -3px, 0);
  opacity: 0;
}
.cm-foldGutter span[title='Fold line']:hover:after {
  opacity: 1;
}
.cm-foldGutter span[title='Unfold line']:after {
  content: '';
  transform: rotate(-45deg) translate3d(-2px, -3px, 0);
  opacity: 1;
}
.cm-foldGutter:hover span[title='Fold line']:after {
  opacity: 1 !important;
}
.cm-editor .cm-lineNumbers .cm-gutterElement {
  padding: 0 6px 0 12px !important;
}
.cm-editor .ͼ1g {
  color: var(--scalar-api-reference-theme-color-2);
}
.cm-editor .ͼ1d,
.cm-editor .ͼc,
.cm-editor .ͼq,
.cm-editor .ͼ7 {
  color: var(--cm-blue);
}
.cm-editor .ͼu,
.cm-editor .ͼb {
  color: var(--cm-green);
}
.cm-editor .ͼ9,
.cm-editor .ͼ1h {
  color: var(--cm-yellow);
}
.cm-editor .ͼi,
.cm-editor .ͼv,
.cm-editor .ͼx,
.cm-editor .ͼ11,
.cm-editor .ͼ14,
.cm-editor .ͼp,
.cm-editor .ͼ6 {
  color: var(--scalar-api-reference-theme-color-3);
}
.cm-editor .cm-content {
  padding: 6px 0;
}
.cm-editor .cm-line {
  color: var(--scalar-api-reference-theme-color-1) !important;
  caret-color: var(--scalar-api-reference-theme-color-1) !important;
}
.cm-cursor {
  border-color: transparent !important;
}
.cm-matchingBracket {
  background: var(--scalar-api-reference-theme-background-3) !important;
}
.cm-editor .cm-gutters {
  font-size: var(--scalar-api-reference-theme-mini);
  color: var(--scalar-api-reference-theme-color-3);
  line-height: 1.44;
  background: var(--scalar-api-reference-theme-background-2);
  border-right: none;
}
.simplecode .cm-editor {
  outline: none !important;
}
.simplecode .cm-editor .cm-scroller {
  background: var(--scalar-api-reference-theme-background-2);
  border-radius: var(--scalar-api-reference-theme-radius);
}
.simplecode .cm-editor .cm-gutters {
  display: none;
}
.cm-editor .cm-gutterElement {
  font-family: var(--scalar-api-reference-theme-font-code) !important;
  padding: 0 6px 0 12px !important;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: var(--scalar-api-reference-theme-background-2);
}
.cm-gutter + .cm-gutter .cm-gutterElement {
  padding-left: 0 !important;
}
.ͼ1 .cm-foldPlaceholder {
  background-color: var(--scalar-api-reference-theme-background-3);
  border: var(--scalar-api-reference-border);
  color: var(--scalar-api-reference-theme-color-3);
}
</style>
