<script lang="ts" setup>
import { html } from '@codemirror/lang-html'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { python } from '@codemirror/lang-python'
import { type LanguageSupport, StreamLanguage } from '@codemirror/language'
import {
  c,
  csharp,
  kotlin,
  objectiveC,
} from '@codemirror/legacy-modes/mode/clike'
import { clojure } from '@codemirror/legacy-modes/mode/clojure'
import { go } from '@codemirror/legacy-modes/mode/go'
import { http } from '@codemirror/legacy-modes/mode/http'
import { oCaml } from '@codemirror/legacy-modes/mode/mllike'
import { powerShell } from '@codemirror/legacy-modes/mode/powershell'
import { r } from '@codemirror/legacy-modes/mode/r'
import { ruby } from '@codemirror/legacy-modes/mode/ruby'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { swift } from '@codemirror/legacy-modes/mode/swift'
import * as yamlMode from '@codemirror/legacy-modes/mode/yaml'
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
    name?: string
    extensions?: Extension[]
    content?: string
    readOnly?: boolean
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

// TODO: Add 'php'
const syntaxHighlighting: Partial<
  Record<CodeMirrorLanguage, LanguageSupport | StreamLanguage<any>>
> = {
  c: StreamLanguage.define(c),
  clojure: StreamLanguage.define(clojure),
  csharp: StreamLanguage.define(csharp),
  go: StreamLanguage.define(go),
  http: StreamLanguage.define(http),
  html: html(),
  java: java(),
  javascript: javascript(),
  json: json(),
  kotlin: StreamLanguage.define(kotlin),
  node: javascript(),
  objc: StreamLanguage.define(objectiveC),
  ocaml: StreamLanguage.define(oCaml),
  powershell: StreamLanguage.define(powerShell),
  python: python(),
  r: StreamLanguage.define(r),
  ruby: StreamLanguage.define(ruby),
  shell: StreamLanguage.define(shell),
  swift: StreamLanguage.define(swift),
  yaml: StreamLanguage.define(yamlMode.yaml),
}

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

  // Read only
  if (props.readOnly) {
    extensions.push(EditorView.editable.of(false))
  }

  // Syntax highlighting
  if (props.languages) {
    props.languages
      .filter((language) => typeof syntaxHighlighting[language] !== 'undefined')
      .forEach((language) => {
        extensions.push(syntaxHighlighting[language] as Extension)
      })
  }

  // Line numbers
  if (props.lineNumbers) {
    extensions.push(lineNumbersExtension())
  }

  return extensions
}

const {
  codeMirrorRef,
  setCodeMirrorContent,
  reconfigureCodeMirror,
  restartCodeMirror,
} = useCodeMirror({
  content: props.content ?? '',
  extensions: getCodeMirrorExtensions(),
  withoutTheme: props.withoutTheme,
  forceDarkMode: props.forceDarkMode,
  onUpdate: (v) => {
    emit('change', v.state.doc.toString())
  },
  disableEnter: props.disableEnter,
  withVariables: props.withVariables,
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

// Document changed. Restarting CodeMirror.
watch(
  () => props.name,
  () => {
    restartCodeMirror(getCodeMirrorExtensions())
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
