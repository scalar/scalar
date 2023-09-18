<script lang="ts" setup>
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
import { type Extension } from '@codemirror/state'
import {
  EditorView,
  type ViewUpdate,
  keymap,
  lineNumbers as lineNumbersExtension,
} from '@codemirror/view'
import { toRaw, watch } from 'vue'

import { useCodeMirror } from '../../hooks'
import { variables } from './extensions/variables'

const props = withDefaults(
  defineProps<{
    extensions?: Extension[]
    content?: string
    readOnly?: boolean
    languages?: Language[]
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

// TODO: Add 'php' and 'laravel'
const syntaxHighlighting: Partial<
  Record<Language, LanguageSupport | StreamLanguage<any>>
> = {
  axios: javascript(),
  c: StreamLanguage.define(c),
  clojure: StreamLanguage.define(clojure),
  csharp: StreamLanguage.define(csharp),
  go: StreamLanguage.define(go),
  http: StreamLanguage.define(http),
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
}

type Language =
  | 'axios'
  | 'c'
  | 'clojure'
  | 'csharp'
  | 'go'
  | 'http'
  | 'java'
  | 'javascript'
  | 'json'
  | 'kotlin'
  | 'node'
  | 'objc'
  | 'ocaml'
  | 'powershell'
  | 'python'
  | 'r'
  | 'ruby'
  | 'shell'
  | 'swift'
  | 'php'

// CSS Class
const classes = ['scalar-api-client__codemirror']

if (props.readOnly) {
  classes.push('scalar-api-client__codemirror--read-only')
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

  // Highlight variables
  if (props.withVariables) {
    extensions.push(variables())
  }

  if (props.disableEnter) {
    extensions.push(
      keymap.of([
        {
          key: 'Enter',
          run: () => {
            return true
          },
        },
        {
          key: 'Ctrl-Enter',
          mac: 'Cmd-Enter',
          run: () => {
            return true
          },
        },
        {
          key: 'Shift-Enter',
          run: () => {
            return true
          },
        },
      ]),
    )
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
})

watch(props, () => {
  setCodeMirrorContent(props.content ?? '')
  reconfigureCodeMirror(getCodeMirrorExtensions())
})

// If the passed extensions change, destroy and remount CodeMirror.
watch(
  () => props.extensions,
  () => {
    restartCodeMirror(getCodeMirrorExtensions())
  },
)

defineExpose({
  setCodeMirrorContent,
})
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

  font-size: var(--theme-small);
}

/* .scalar-api-client__codemirror.ͼw {
  background-color: var(--theme-background-1);
}

.scalar-api-client__codemirror--read-only.ͼw {
  background-color: var(--theme-background-2);
} */

/** URL input */
.scalar-api-client__url-input {
  font-weight: var(--theme-semibold);
}

/* .scalar-api-client__url-input .cm-scroller {
  padding-left: 6px;
}

.scalar-api-client__url-input .ͼ1 .cm-scroller {
  align-items: center !important;
} */

.scalar-api-client__variable {
  color: var(--scalar-api-client-color);
}
</style>
