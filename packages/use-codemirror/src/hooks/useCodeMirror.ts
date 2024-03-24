import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete'
import { indentWithTab } from '@codemirror/commands'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import { yaml } from '@codemirror/lang-yaml'
import {
  type LanguageSupport,
  type StreamLanguage,
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { type Extension, StateEffect } from '@codemirror/state'
import {
  EditorView,
  type KeyBinding,
  highlightSpecialChars,
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
  language: MaybeRefOrGetter<CodeMirrorLanguage | undefined>
  /** Class names to apply to the instance */
  classes?: MaybeRefOrGetter<string[] | undefined>
  /** Put the editor into read-only mode */
  readOnly?: MaybeRefOrGetter<boolean | undefined>
  /** Option to show line numbers in the editor */
  lineNumbers?: MaybeRefOrGetter<boolean | undefined>
  withVariables?: MaybeRefOrGetter<boolean | undefined>
  disableEnter?: MaybeRefOrGetter<boolean | undefined>
  onBlur?: (v: string) => void
  onFocus?: (v: string) => void
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

const selectAllKeyBinding: KeyBinding = {
  key: 'Mod-a',
  run: (view) => {
    // Select the entire content
    view.dispatch({
      selection: { anchor: 0, head: view.state.doc.length },
      scrollIntoView: false,
    })
    return true
  },
}

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
    if (params.codeMirrorRef.value) {
      const provider = hasProvider(params) ? toValue(params.provider) : null
      const extensions = getCodeMirrorExtensions({
        ...extensionConfig.value,
        provider,
      })

      codeMirror.value = new EditorView({
        parent: params.codeMirrorRef.value,
        extensions,
      })

      // Set the initial content if a provider is not in use
      if (!hasProvider(params)) setCodeMirrorContent(toValue(params.content))
    }
  }

  // ---------------------------------------------------------------------------

  // All options except provider
  const extensionConfig = computed(() => ({
    onChange: params.onChange,
    onBlur: params.onBlur,
    onFocus: params.onFocus,
    language: toValue(params.language),
    classes: toValue(params.classes),
    readOnly: toValue(params.readOnly),
    lineNumbers: toValue(params.lineNumbers),
    withVariables: toValue(params.withVariables),
    disableEnter: toValue(params.withVariables),
    withoutTheme: toValue(params.withoutTheme),
    additionalExtensions: toValue(params.extensions),
  }))

  // Provider must be watched separately because we need to restart codemirror if the provider changes
  watch(
    () => (hasProvider(params) ? toValue(params.provider) : null),
    () => {
      if (hasProvider(params)) {
        codeMirror.value?.destroy()
        mountCodeMirror()
      }
    },
  )

  // Update the extensions whenever parameters changes
  watch(
    extensionConfig,
    () => {
      if (!codeMirror.value) return
      // If a provider is
      else {
        const provider = hasProvider(params) ? toValue(params.provider) : null
        const extensions = getCodeMirrorExtensions({
          ...extensionConfig.value,
          provider,
        })

        codeMirror.value.dispatch({
          effects: StateEffect.reconfigure.of(extensions),
        })
      }
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

const languageExtensions: {
  [lang in CodeMirrorLanguage]: () => LanguageSupport | StreamLanguage<any>
} = {
  html: html,
  json: json,
  yaml: yaml,
  css: css,
}

/** Generate  the list of extension from parameters */
function getCodeMirrorExtensions({
  onChange,
  onBlur,
  onFocus,
  provider,
  language,
  classes = [],
  readOnly = false,
  lineNumbers = false,
  withVariables = false,
  disableEnter = false,
  withoutTheme = false,
  additionalExtensions = [],
}: {
  classes?: string[]
  language?: CodeMirrorLanguage
  readOnly?: boolean
  lineNumbers?: boolean
  withVariables?: boolean
  disableEnter?: boolean
  onChange?: (val: string) => void
  onFocus?: (val: string) => void
  onBlur?: (val: string) => void
  withoutTheme?: boolean
  provider: Extension | null
  additionalExtensions?: Extension[]
}) {
  const extensions: Extension[] = [
    highlightSpecialChars(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    EditorView.theme({
      '.cm-line': {
        lineHeight: '20px',
      },
      '.cm-gutterElement': {
        lineHeight: '20px',
      },
    }),
    // Listen to updates
    EditorView.updateListener.of((v) => {
      if (!v.docChanged) return
      onChange?.(v.state.doc.toString())
    }),
    EditorView.domEventHandlers({
      blur: (event, view) => {
        onBlur?.(view.state.doc.toString())
      },
      focus: (event, view) => {
        onFocus?.(view.state.doc.toString())
      },
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
  if (readOnly) {
    extensions.push(EditorView.editable.of(false))
  } else {
    extensions.push(
      indentOnInput(),
      bracketMatching(),
      autocompletion(),
      closeBrackets(),
      keymap.of([
        ...completionKeymap,
        ...closeBracketsKeymap,
        indentWithTab,
        selectAllKeyBinding,
      ]),
    )
  }

  // Syntax highlighting
  if (language && languageExtensions[language]) {
    extensions.push(languageExtensions[language]())
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
