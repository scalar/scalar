import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { history, historyKeymap, indentWithTab, insertNewline } from '@codemirror/commands'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { yaml } from '@codemirror/lang-yaml'
import {
  type LanguageSupport,
  type StreamLanguage,
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { type Diagnostic, linter } from '@codemirror/lint'
import { type Extension, StateEffect } from '@codemirror/state'
import {
  EditorView,
  type KeyBinding,
  highlightSpecialChars,
  keymap,
  lineNumbers as lineNumbersExtension,
  placeholder as placeholderExtension,
} from '@codemirror/view'
import { type MaybeRefOrGetter, type Ref, onBeforeUnmount, ref, toValue, watch } from 'vue'

const CHEVRON_DOWN =
  '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m18 10-6 6-6-6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const CHEVRON_RIGHT =
  '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m9 18 6-6-6-6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>'

import { customTheme } from '../themes'
import type { CodeMirrorLanguage } from '../types'
import { variables } from './variables'

/**
 * This was an insane bug that only exists in chrome
 *
 * Found these issues which may be related, it says che chrome one is fixed, they possibly had a regression?
 *
 * @see https://issues.chromium.org/issues/375711382
 * @see https://discuss.codemirror.net/t/experimental-support-for-editcontext/8144
 * @see https://github.com/codemirror/dev/issues/1458
 */
// @ts-expect-error this is the workaround suggested by codemirror
EditorView.EDIT_CONTEXT = false

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
  /** Disable indent with tab */
  disableTabIndent?: MaybeRefOrGetter<boolean | undefined>
  /** Option to show line numbers in the editor */
  lineNumbers?: MaybeRefOrGetter<boolean | undefined>
  withVariables?: MaybeRefOrGetter<boolean | undefined>
  forceFoldGutter?: MaybeRefOrGetter<boolean | undefined>
  disableEnter?: MaybeRefOrGetter<boolean | undefined>
  disableCloseBrackets?: MaybeRefOrGetter<boolean | undefined>
  /** Option to lint and show error in the editor */
  lint?: MaybeRefOrGetter<boolean | undefined>
  onBlur?: (v: string, event: FocusEvent) => void
  onFocus?: (v: string, event: FocusEvent) => void
  placeholder?: MaybeRefOrGetter<string | undefined>
}

export type UseCodeMirrorParameters =
  | (BaseParameters & {
      /** Prefill the content. Will be ignored when a provider is given. */
      content: MaybeRefOrGetter<string | undefined>
      onChange?: (v: string) => void
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

  /** Set the codemirror content value */
  const setCodeMirrorContent = (newValue = '') => {
    if (!codeMirror.value) {
      return
    }

    // No need to set the CodeMirror content if nothing has changed
    if (codeMirror.value.state.doc.toString() === newValue) {
      return
    }

    codeMirror.value.dispatch({
      changes: {
        from: 0,
        to: codeMirror.value.state.doc.length,
        insert: newValue,
      },
      selection: {
        anchor: Math.min(codeMirror.value.state.selection.main.anchor, newValue.length),
      },
    })
  }

  // Primitive-level sources for the extensions watcher. Listed as individual
  // getter functions so Vue's multi-source watch can do per-element === comparison.
  // A single `computed(() => ({ ... }))` always produces a new object reference
  // and would appear dirty on every flush; a single `computed(() => [...])` has
  // the same problem. Individual sources are compared element-wise, so the watch
  // only fires when a value actually changes.
  // NOTE: when adding a new param, add its getter here AND add its `toValue()` call inside `buildExtensions`.
  const reconfigureSources = [
    () => params.onChange,
    () => params.onBlur,
    () => params.onFocus,
    () => toValue(params.disableTabIndent),
    () => toValue(params.language),
    () => toValue(params.classes),
    () => toValue(params.readOnly),
    () => toValue(params.lineNumbers),
    () => toValue(params.withVariables),
    () => toValue(params.forceFoldGutter),
    () => toValue(params.disableEnter),
    () => toValue(params.disableCloseBrackets),
    () => toValue(params.withoutTheme),
    () => toValue(params.lint),
    // Array identity: only triggers when the caller passes a new array reference.
    // Callers must keep their extensions array stable to avoid spurious reconfigures.
    () => toValue(params.extensions),
    () => toValue(params.placeholder),
  ]

  // Builds the full extension list from the current param values.
  // NOTE: when adding a new param, add its getter here AND add its `toValue()` call inside `buildExtensions`.
  // Must be declared before the immediate codeMirrorRef watch below to avoid a temporal dead zone error.
  const buildExtensions = (provider: Extension | null): Extension[] =>
    getCodeMirrorExtensions({
      onChange: params.onChange,
      onBlur: params.onBlur,
      onFocus: params.onFocus,
      provider,
      language: toValue(params.language),
      classes: toValue(params.classes),
      readOnly: toValue(params.readOnly),
      lineNumbers: toValue(params.lineNumbers),
      withVariables: toValue(params.withVariables),
      forceFoldGutter: toValue(params.forceFoldGutter),
      disableEnter: toValue(params.disableEnter),
      disableCloseBrackets: toValue(params.disableCloseBrackets),
      disableTabIndent: toValue(params.disableTabIndent),
      withoutTheme: toValue(params.withoutTheme),
      lint: toValue(params.lint),
      additionalExtensions: toValue(params.extensions),
      placeholder: toValue(params.placeholder),
    })

  // Initializes CodeMirror.
  function mountCodeMirror() {
    if (params.codeMirrorRef.value) {
      const provider = hasProvider(params) ? toValue(params.provider) : null
      const extensions = buildExtensions(provider)

      codeMirror.value = new EditorView({
        parent: params.codeMirrorRef.value,
        extensions,
      })

      // Set the initial content if a provider is not in use
      if (!hasProvider(params)) {
        setCodeMirrorContent(toValue(params.content))
      }
    }
  }

  // Unmounts CodeMirror if it's mounted already, and mounts CodeMirror, if the given ref exists.
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

  // ---------------------------------------------------------------------------

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

  // Update the extensions when any scalar config field or the extensions array
  // identity actually changes. We watch `reconfigureSignal` (a tuple of
  // primitives + the array ref) rather than `extensionConfig` (an object)
  // because Vue compares computed values with ===: an object computed always
  // looks dirty, whereas a tuple of primitives only looks dirty when a value
  // inside it changes.
  //
  // We intentionally do NOT use { immediate: true } here because
  // mountCodeMirror() already applies the correct extensions when the editor
  // is first created — an immediate run would schedule a redundant
  // StateEffect.reconfigure on every mount.
  watch(reconfigureSources, () => {
    if (!codeMirror.value) {
      return
    }

    const provider = hasProvider(params) ? toValue(params.provider) : null
    const extensions = buildExtensions(provider)

    requestAnimationFrame(() => {
      codeMirror.value?.dispatch({
        effects: StateEffect.reconfigure.of(extensions),
      })
    })
  })

  // ---------------------------------------------------------------------------

  // Keep the content in sync when the content is managed externally
  watch(
    () => toValue(params.content),
    () => {
      // When a provider is in use we do not map the content value back to the codemirror instance
      if (hasProvider(params)) {
        return
      }

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
  xml: xml,
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
  forceFoldGutter = false,
  disableEnter = false,
  disableCloseBrackets = false,
  disableTabIndent = false,
  withoutTheme = false,
  lint = false,
  additionalExtensions = [],
  placeholder,
}: {
  classes?: string[]
  language?: CodeMirrorLanguage
  readOnly?: boolean
  lineNumbers?: boolean
  disableCloseBrackets?: boolean
  disableTabIndent?: boolean
  withVariables?: boolean
  disableEnter?: boolean
  forceFoldGutter?: boolean
  onChange?: (val: string) => void
  onFocus?: (val: string, event: FocusEvent) => void
  onBlur?: (val: string, event: FocusEvent) => void
  withoutTheme?: boolean
  provider: Extension | null
  lint?: boolean
  additionalExtensions?: Extension[]
  placeholder?: string
}) {
  const extensions: Extension[] = [
    highlightSpecialChars(),
    history(),
    keymap.of(historyKeymap),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    EditorView.theme({
      '.cm-line': {
        lineHeight: '22px',
        padding: '0 2px 0 4px',
      },
      '.cm-gutterElement': {
        lineHeight: '22px',
      },
      '.cm-tooltip': {
        background: 'var(--scalar-background-1)',
        border: '1px solid var(--scalar-border-color)',
        borderRadius: 'var(--scalar-radius)',
        boxShadow: 'var(--scalar-shadow-2)',
        fontSize: '12px',
        overflow: 'hidden',
      },
      '.cm-tooltip-autocomplete ul': {
        padding: '6px',
      },
      '.cm-tooltip-autocomplete ul li': {
        padding: '3px 6px',
        color: 'var(--scalar-color-1)',
        borderRadius: '3px',
      },
      '.cm-tooltip-autocomplete ul li[aria-selected]': {
        background: 'var(--scalar-background-2)',
        color: 'var(--scalar-color-1)',
      },
      '.cm-tooltip-autocomplete ul li:hover': {
        background: 'var(--scalar-background-3)',
        color: 'var(--scalar-color-1)',
      },
      '.cm-completionLabel': {
        color: 'var(--scalar-color-1)',
      },
      '.cm-completionDetail': {
        color: 'var(--scalar-color-3)',
      },
      '.cm-tooltip-lint': {
        backgroundColor: 'var(--scalar-background-1)',
      },
      '.cm-diagnostic-error': {
        borderLeft: '0',
        color: '#dc1b19',
      },
      '.cm-foldPlaceholder': {
        background: 'var(--scalar-background-1)',
        border: 'none',
        fontFamily: 'var(--scalar-font)',
      },
    }),
    // Listen to updates
    EditorView.updateListener.of((v) => {
      if (!v.docChanged) {
        return
      }
      onChange?.(v.state.doc.toString())
    }),
    EditorView.domEventHandlers({
      blur: (event, view) => {
        onBlur?.(view.state.doc.toString(), event)
      },
      focus: (event, view) => {
        onFocus?.(view.state.doc.toString(), event)
      },
    }),
    // Add Classes
    EditorView.editorAttributes.of({ class: classes.join(' ') }),
    ...additionalExtensions,
  ]

  // Enable the provider
  if (provider) {
    extensions.push(provider)
  }

  // Add the theme as needed
  if (!withoutTheme) {
    extensions.push(customTheme)
  }

  // Read only
  if (readOnly) {
    extensions.push(EditorView.editable.of(false))
  } else {
    extensions.push(
      indentOnInput(),
      bracketMatching(),
      autocompletion(),
      keymap.of([...completionKeymap, selectAllKeyBinding]),
      bracketMatching(),
    )

    if (!disableCloseBrackets) {
      extensions.push(closeBrackets(), keymap.of([...closeBracketsKeymap]))
    }

    if (disableTabIndent) {
      extensions.push(
        keymap.of([
          {
            key: 'Tab',
            run: () => false, // Prevent default Tab behavior
            shift: () => false, // Prevent default Shift+Tab behavior
          },
        ]),
      )
    } else {
      extensions.push(keymap.of([indentWithTab]))
    }
  }

  // Add placeholder extension if placeholder is provided
  if (placeholder) {
    extensions.push(placeholderExtension(placeholder))
  }

  // Line numbers
  if (lineNumbers) {
    extensions.push(lineNumbersExtension())
  }

  if (forceFoldGutter) {
    extensions.push(
      foldGutter({
        markerDOM: (open) => {
          const icon = document.createElement('div')
          icon.classList.add('cm-foldMarker')
          icon.innerHTML = open ? CHEVRON_DOWN : CHEVRON_RIGHT
          return icon
        },
      }),
    )
  }

  // Syntax highlighting
  if (language && languageExtensions[language]) {
    extensions.push(languageExtensions[language]())
    if (!forceFoldGutter) {
      extensions.push(
        foldGutter({
          markerDOM: (open) => {
            const icon = document.createElement('div')
            icon.classList.add('cm-foldMarker')
            icon.innerHTML = open ? CHEVRON_DOWN : CHEVRON_RIGHT
            return icon
          },
        }),
      )
    }
  }

  // JSON Linter
  if (lint && language === 'json') {
    const jsonLinter = linter((view) => {
      const diagnostics: Diagnostic[] = []
      const content = view.state.doc.toString()
      if (content.trim()) {
        try {
          JSON.parse(content)
        } catch (e) {
          if (e instanceof Error) {
            diagnostics.push({
              from: 0,
              to: view.state.doc.length,
              severity: 'error',
              message: e.message,
            })
          }
        }
      }
      return diagnostics
    })
    extensions.push(jsonLinter)
  }

  // Highlight variables
  if (withVariables) {
    extensions.push(variables())
  }

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
  } else {
    extensions.push(
      keymap.of([
        {
          key: 'Enter',
          run: insertNewline,
        },
      ]),
    )
  }

  return extensions
}
