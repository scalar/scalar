import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { php } from '@codemirror/lang-php'
import { python } from '@codemirror/lang-python'
import { rust } from '@codemirror/lang-rust'
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
import { type Extension, StateEffect } from '@codemirror/state'
import {
  EditorView,
  type ViewUpdate,
  keymap,
  lineNumbers as lineNumbersExtension,
} from '@codemirror/view'
import {
  type MaybeRefOrGetter,
  type Ref,
  computed,
  onBeforeUnmount,
  ref,
  toValue,
  watch,
} from 'vue'

import { customTheme } from '../themes'
import type { CodeMirrorLanguage } from '../types'
import { variables } from './variables'

type BaseParameters = {
  /** Element Ref to mount codemirror to */
  codeMirrorRef: Ref<HTMLDivElement | null>
  /** List of optional extensions for the instance */
  extensions?: MaybeRefOrGetter<Extension[]>
  /** Whether to load a theme.*/
  withoutTheme?: MaybeRefOrGetter<boolean | undefined>
  /** Languages to support for syntax highlighting */
  languages?: MaybeRefOrGetter<CodeMirrorLanguage[] | undefined>
  /** Class names to apply to the instance */
  classes?: MaybeRefOrGetter<string[] | undefined>
  /** Put the editor into read-only mode */
  readOnly?: MaybeRefOrGetter<boolean | undefined>
  /** Option to show line numbers in the editor */
  lineNumbers?: MaybeRefOrGetter<boolean | undefined>
  withVariables?: MaybeRefOrGetter<boolean | undefined>
  disableEnter?: MaybeRefOrGetter<boolean | undefined>
}

export type UseCodeMirrorParameters =
  | (BaseParameters & {
      /** Prefill the content. Will be ignored when a provider is given. */
      content: MaybeRefOrGetter<string | undefined>
      onChange: (v: string) => void
    })
  | (BaseParameters & {
      provider: MaybeRefOrGetter<Extension | null>
      content?: MaybeRefOrGetter<string | undefined>
      onChange?: (v: string) => void
    })

/** Check if the hook has a provider. In provider mode we ignore the content variable */
const hasProvider = (
  params: UseCodeMirrorParameters,
): params is BaseParameters & {
  content?: MaybeRefOrGetter<string | undefined>
  provider: MaybeRefOrGetter<Extension>
} => 'provider' in params && !!toValue(params.provider)

/** Reactive CodeMirror Integration */
export const useCodeMirror = (
  params: UseCodeMirrorParameters,
): {
  setCodeMirrorContent: (content?: string) => void
  codeMirror: Ref<EditorView | null>
} => {
  const codeMirror: Ref<EditorView | null> = ref(null)

  // Unmounts CodeMirror if it’s mounted already, and mounts CodeMirror, if the given ref exists.
  watch(
    params.codeMirrorRef,
    () => {
      codeMirror.value?.destroy()
      mountCodeMirror()
    },
    { immediate: true },
  )

  // Cleanup codemirror
  onBeforeUnmount(() => codeMirror.value?.destroy())

  // Initializes CodeMirror.
  function mountCodeMirror() {
    console.debug('MOUNTING CODEMIRROR')
    if (params.codeMirrorRef.value) {
      const extensions = getCodeMirrorExtensions(extensionConfig.value)

      codeMirror.value = new EditorView({
        parent: params.codeMirrorRef.value,
        extensions,
      })

      // Set the initial content if a provider is not in use
      if (!hasProvider(params)) setCodeMirrorContent(toValue(params.content))
    }
  }

  // ---------------------------------------------------------------------------

  const extensionConfig = computed(() => ({
    onChange: params.onChange,
    languages: toValue(params.languages),
    classes: toValue(params.classes),
    readOnly: toValue(params.readOnly),
    lineNumbers: toValue(params.lineNumbers),
    withVariables: toValue(params.withVariables),
    disableEnter: toValue(params.withVariables),
    withoutTheme: toValue(params.withoutTheme),
    additionalExtensions: toValue(params.extensions),
    provider: hasProvider(params) ? toValue(params.provider) : null,
  }))

  // Update the extensions whenever parameters changes
  watch(
    extensionConfig,
    () => {
      if (!codeMirror.value) return

      const extensions = getCodeMirrorExtensions(extensionConfig.value)

      codeMirror.value.dispatch({
        effects: StateEffect.reconfigure.of(extensions),
      })
    },
    { immediate: true },
  )

  // ---------------------------------------------------------------------------

  /** Set the codemirror content value */
  const setCodeMirrorContent = (newValue = '') => {
    if (!codeMirror.value) return

    // No need to set the CodeMirror content if nothing has changed
    if (codeMirror.value.state.doc.toString() === newValue) return

    codeMirror.value.dispatch({
      changes: {
        from: 0,
        to: codeMirror.value.state.doc.length,
        insert: newValue,
      },
      selection: {
        anchor: Math.min(
          codeMirror.value.state.selection.main.anchor,
          newValue.length,
        ),
      },
    })
  }

  // Keep the content in sync when the content is managed externally
  watch(
    () => toValue(params.content),
    () => {
      // When a provider is in use we do not map the content value back to the codemirror instance
      if (hasProvider(params)) return

      setCodeMirrorContent(toValue(params.content))
    },
    { immediate: true },
  )

  return {
    /** Replaces the current content with the given value. */
    setCodeMirrorContent,
    /** Codemirror instance */
    codeMirror,
  }
}

// ---------------------------------------------------------------------------

const syntaxHighlighting: {
  [lang in CodeMirrorLanguage]: LanguageSupport | StreamLanguage<any>
} = {
  c: StreamLanguage.define(c),
  clojure: StreamLanguage.define(clojure),
  csharp: StreamLanguage.define(csharp),
  css: css(),
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
  php: php(),
  r: StreamLanguage.define(r),
  ruby: StreamLanguage.define(ruby),
  rust: rust(),
  shell: StreamLanguage.define(shell),
  swift: StreamLanguage.define(swift),
  yaml: StreamLanguage.define(yamlMode.yaml),
}

/** Generate the list of extension from parameters */
function getCodeMirrorExtensions({
  onChange,
  provider,
  languages = [],
  classes = [],
  readOnly = false,
  lineNumbers = false,
  withVariables = false,
  disableEnter = false,
  withoutTheme = false,
  additionalExtensions = [],
}: {
  classes?: string[]
  languages?: CodeMirrorLanguage[]
  readOnly?: boolean
  lineNumbers?: boolean
  withVariables?: boolean
  disableEnter?: boolean
  onChange?: (val: string) => void
  withoutTheme?: boolean
  provider: Extension | null
  additionalExtensions?: Extension[]
}) {
  const extensions: Extension[] = [
    EditorView.theme({
      '.cm-line': {
        lineHeight: '20px',
      },
      '.cm-gutterElement': {
        lineHeight: '20px',
      },
    }),
    // Listen to updates
    EditorView.updateListener.of((v: ViewUpdate) => {
      if (!v.docChanged) return
      onChange?.(v.state.doc.toString())
    }),
    // Add Classes
    EditorView.editorAttributes.of({ class: classes.join(' ') }),
    ...additionalExtensions,
  ]

  // Enable the provider
  if (provider) extensions.push(provider)

  // Add the theme as needed
  if (!withoutTheme) extensions.push(customTheme)

  // Read only
  if (readOnly) extensions.push(EditorView.editable.of(false))

  // Syntax highlighting
  if (languages.length) {
    languages
      .filter((language) => typeof syntaxHighlighting[language] !== 'undefined')
      .forEach((language) => {
        extensions.push(syntaxHighlighting[language] as Extension)
      })
  }

  // Line numbers
  if (lineNumbers) extensions.push(lineNumbersExtension())

  // Highlight variables
  if (withVariables) extensions.push(variables())

  if (disableEnter) {
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

  return extensions
}
