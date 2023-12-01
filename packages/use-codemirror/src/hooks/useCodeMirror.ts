import { type Extension, StateEffect } from '@codemirror/state'
import {
  EditorView,
  type EditorViewConfig,
  type KeyBinding,
  type ViewUpdate,
  keymap,
  lineNumbers as lineNumbersExtension,
} from '@codemirror/view'
import { type Ref, isRef, ref, toRaw, watch } from 'vue'

import { defaultTheme } from '../themes'
import type { CodeMirrorLanguage } from '../types'
import { variables } from './extensions/variables'
import { syntaxHighlighting } from './syntaxHighlighting'

export type CodeMirrorExtension = Extension

type UseCodeMirrorParameters = {
  /**
   * Some additional CodeMirror extensions.
   */
  extensions?: Extension[]
  /**
   * Prefill the content.
   */
  content?: string | Ref<string>
  /**
   * Whether to load a theme.
   */
  withoutTheme?: boolean
  /**
   * Triggered when the content changes
   */
  onUpdate: (v: ViewUpdate) => void
  /**
   * For single-line instances, disable the enter key.
   */
  disableEnter?: boolean
  /**
   * Enable variable highlighting
   */
  withVariables?: boolean
  /**
   * The language to use for syntax highlighting
   */
  language?: CodeMirrorLanguage
  /**
   * Whether the editor is read-only
   */
  readOnly?: boolean
  /**
   * Whether to show line numbers
   */
  lineNumbers?: boolean
}

export const useCodeMirror = (
  parameters: UseCodeMirrorParameters,
): {
  value: Ref<string>
  codeMirrorRef: Ref<HTMLDivElement | null>
  codeMirror: Ref<EditorView | null>
  setCodeMirrorContent: (content: string) => void
  reconfigureCodeMirror: (newExtensions: Extension[]) => void
  restartCodeMirror: (newExtensions: Extension[]) => void
} => {
  const { content, withoutTheme } = parameters
  const value = ref(content ?? '')
  const codeMirrorRef = ref<HTMLDivElement | null>(null)
  const codeMirror = ref<EditorView | null>(null)
  const setCodeMirrorRef = (el: HTMLDivElement) => (codeMirrorRef.value = el)

  // Unmounts CodeMirror if it’s mounted already, and mounts CodeMirror, if the given ref exists.
  watch(codeMirrorRef, () => {
    destroyCodeMirror()
    mountCodeMirror()
  })

  // Settings changed. Reconfiguring CodeMirror …
  watch(
    [
      () => parameters.disableEnter,
      () => parameters.language,
      () => parameters.lineNumbers,
      () => parameters.readOnly,
      () => parameters.withoutTheme,
      () => parameters.withVariables,
    ],
    () => {
      reconfigureCodeMirror()
    },
  )

  // Content changed. Updating CodeMirror …
  watch(
    () => content,
    () => {
      setCodeMirrorContent(
        isRef(content) ? content.value : content ? content : '',
      )
    },
  )

  // Initializes CodeMirror.
  const mountCodeMirror = () => {
    if (codeMirrorRef.value) {
      const configuration: EditorViewConfig = {
        parent: codeMirrorRef.value,
        extensions: addDefaultExtensions(),
      }

      // Only set the content, when not in collaborative editing mode
      if ((isRef(content) && content.value) || content) {
        configuration.doc = isRef(content) ? content.value : content
      }

      codeMirror.value = new EditorView(configuration)
    }
  }

  const getCurrentTheme = () => {
    // return null
    if (withoutTheme) {
      return null
    }

    return defaultTheme
  }

  // Extend the given extension list with a dark/light theme.
  const addDefaultExtensions = (newExtensions: Extension[] = []) => {
    // sometimes codemirror only selects what's in view
    // so we double up the keybinding to make sure it selects everything
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

    // Themes
    const defaultExtensions: Extension[] = [
      // Additional extensions
      (parameters.extensions ?? []).map((extension) => {
        return toRaw(extension)
      }),
      // CSS Class
      EditorView.editorAttributes.of({ class: 'scalar-codemirror' }),
      // Theme
      EditorView.theme({
        '.cm-line': {
          lineHeight: '20px',
        },
        '.cm-gutterElement': {
          lineHeight: '20px',
        },
      }),
      // Read-only
      EditorView.editable.of(parameters.readOnly ? false : true),
      // Syntax highlighting
      typeof parameters.language !== 'undefined' &&
      typeof syntaxHighlighting[parameters.language] !== 'undefined'
        ? (syntaxHighlighting[parameters.language] as Extension)
        : null,
      // Highlight variables
      parameters.withVariables ? variables() : null,
      // Line numbers
      parameters.lineNumbers ? lineNumbersExtension() : null,
      // Listen to updates
      EditorView.updateListener.of((v: ViewUpdate) => {
        if (!v.docChanged) {
          return
        }

        parameters?.onUpdate(v)
      }),
      keymap.of([selectAllKeyBinding]),
      // Disable Enter key
      parameters.disableEnter
        ? keymap.of([
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
          ])
        : null,
      getCurrentTheme(),
    ].filter((extension) => extension !== null) as Extension[]

    return [...defaultExtensions, newExtensions]
  }

  // Removes CodeMirror.
  const destroyCodeMirror = () => {
    codeMirror.value?.destroy()
  }

  const setCodeMirrorContent = (newValue: string) => {
    // Check whether CodeMirror is mounted properly.
    if (!codeMirror.value) {
      return
    }

    if (value.value === newValue) {
      // No need to update the content ref
      return
    }

    value.value = newValue

    if (codeMirror.value.state.doc.toString() === newValue) {
      // No need to set the CodeMirror content
      return
    }

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

  const reconfigureCodeMirror = () => {
    if (!codeMirror.value) {
      return
    }

    codeMirror.value.dispatch({
      effects: StateEffect.reconfigure.of(addDefaultExtensions()),
    })
  }

  const restartCodeMirror = () => {
    destroyCodeMirror()
    mountCodeMirror()
  }

  return {
    /**
     * The current value
     */
    value,
    /**
     * An empty reference used to mount CodeMirror when bound to the DOM.
     */
    codeMirrorRef,
    /**
     * Function for setting the CodeMirrorRef, pass this into SwaggerEditor
     */
    setCodeMirrorRef,
    /**
     * The CodeMirror instance.
     */
    // @ts-ignore
    codeMirror,
    /**
     * Replaces the current content with the given value.
     */
    setCodeMirrorContent,
    /**
     * Reconfigure the used extensions.
     */
    reconfigureCodeMirror,
    /**
     * Restarts CodeMirror (destroy + mount)
     */
    restartCodeMirror,
  }
}
