import { type Extension, StateEffect } from '@codemirror/state'
import {
  type EditorViewConfig,
  type KeyBinding,
  type ViewUpdate,
  keymap,
} from '@codemirror/view'
import { EditorView } from 'codemirror'
import { type Ref, ref, watch } from 'vue'

import { darkTheme, lightTheme } from '../themes'

/** TODO: This is a static value, make it work with a dynamic parameter. */
const isDark = ref(true)

type UseCodeMirrorParameters = {
  /**
   * Some additional CodeMirror extensions.
   */
  extensions: Extension[]
  /**
   * Prefill the content.
   */
  content?: string
  /**
   * Force the dark mode.
   */
  forceDarkMode?: boolean
  /**
   * Force the light mode.
   */
  forceLightMode?: boolean
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
  onUpdate: (v: ViewUpdate) => void
  disableEnter: boolean
} => {
  const { extensions, content, forceDarkMode, forceLightMode, withoutTheme } =
    parameters
  const value = ref(content ?? '')
  const codeMirrorRef = ref<HTMLDivElement | null>(null)
  const codeMirror = ref<EditorView | null>(null)

  // Unmounts CodeMirror if it’s mounted already, and mounts CodeMirror, if the given ref exists.
  watch(codeMirrorRef, () => {
    destroyCodeMirror()
    mountCodeMirror(extensions)
  })

  // Initializes CodeMirror.
  const mountCodeMirror = (withCustomExtensions: Extension[]) => {
    if (codeMirrorRef.value) {
      const configuration: EditorViewConfig = {
        parent: codeMirrorRef.value,
        extensions: addDefaultExtensions(withCustomExtensions),
      }

      // Only set the content, when not in collaborative editing mode
      if (content) {
        configuration.doc = content
      }

      codeMirror.value = new EditorView(configuration)
    }
  }

  const getCurrentTheme = () => {
    // return null
    if (withoutTheme) {
      return null
    }

    if (forceDarkMode) {
      return darkTheme
    }

    if (forceLightMode) {
      return lightTheme
    }

    if (isDark.value) {
      return darkTheme
    }

    return lightTheme
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
      EditorView.theme(
        {
          '.cm-line': {
            lineHeight: '20px',
          },
          '.cm-gutterElement': {
            lineHeight: '20px',
          },
        },
        { dark: forceDarkMode ? false : isDark.value },
      ),
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

  watch(isDark, () => {
    const { extensions: configuredExtensions } = parameters

    if (!forceDarkMode) {
      reconfigureCodeMirror(configuredExtensions)
    }
  })

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

  const reconfigureCodeMirror = (newExtensions: Extension[]) => {
    if (!codeMirror.value) {
      return
    }

    codeMirror.value.dispatch({
      effects: StateEffect.reconfigure.of(addDefaultExtensions(newExtensions)),
    })
  }

  const restartCodeMirror = (newExtensions: Extension[]) => {
    destroyCodeMirror()
    mountCodeMirror(newExtensions)
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
