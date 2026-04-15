/**
 * CodeMirror setup, dynamically imported to create a code-split boundary.
 *
 * This file is NEVER imported statically. All callers use `import('./codemirror-setup')`.
 * Keeping all heavy `@codemirror/*` imports here means they live in a separate chunk.
 *
 * @see useCodeMirror.ts for the public hook that lazy-loads this file.
 */

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
import { StateEffect } from '@codemirror/state'
import {
  EditorView,
  type KeyBinding,
  highlightSpecialChars,
  keymap,
  lineNumbers as lineNumbersExtension,
  placeholder as placeholderExtension,
} from '@codemirror/view'

import { customTheme } from '../themes'
import type { CodeMirrorLanguage } from '../types'
import { variables } from './variables'

export { EditorView, StateEffect }

const CHEVRON_DOWN =
  '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m18 10-6 6-6-6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const CHEVRON_RIGHT =
  '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m9 18 6-6-6-6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>'

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

const languageExtensions: {
  [lang in CodeMirrorLanguage]: () => LanguageSupport | StreamLanguage<any>
} = {
  html: html,
  json: json,
  yaml: yaml,
  css: css,
  xml: xml,
}

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

/** Generate the list of extensions from parameters */
export const getCodeMirrorExtensions = ({
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
  provider: import('@codemirror/state').Extension | null
  lint?: boolean
  additionalExtensions?: import('@codemirror/state').Extension[]
  placeholder?: string
}): import('@codemirror/state').Extension[] => {
  const extensions: import('@codemirror/state').Extension[] = [
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
