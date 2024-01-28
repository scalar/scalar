import { type Extension, StateEffect } from '@codemirror/state'
import { type EditorViewConfig } from '@codemirror/view'
import { EditorView } from 'codemirror'
import { type Ref, ref, watch } from 'vue'

import { customTheme } from '../themes'

type UseCodeMirrorParameters = {
  /**
   * Some additional CodeMirror extensions.
   */
  extensions: Extension[]
  /**
   * Prefill the content. Will be ignored when a provider is given.
   */
  content?: string
  /**
   * Whether to load a theme.
   */
  withoutTheme?: boolean
}

export const useCodeMirror = (
  parameters: UseCodeMirrorParameters,
): {
  value: Ref<string>
  codeMirrorRef: Ref<HTMLDivElement | null>
  codeMirror: Ref<EditorView | null>
  setCodeMirrorContent: (content?: string) => void
  reconfigureCodeMirror: (newExtensions: Extension[]) => void
  restartCodeMirror: (newExtensions: Extension[]) => void
} => {
  const { extensions, content, withoutTheme } = parameters
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

  // All default extensions
  const addDefaultExtensions = (newExtensions: Extension[] = []) => {
    const defaultExtensions: Extension[] = [
      withoutTheme ? null : customTheme,
      EditorView.theme({
        '.cm-line': {
          lineHeight: '20px',
        },
        '.cm-gutterElement': {
          lineHeight: '20px',
        },
      }),
    ].filter((extension) => extension !== null) as Extension[]

    return [...defaultExtensions, newExtensions]
  }

  // Removes CodeMirror.
  const destroyCodeMirror = () => {
    codeMirror.value?.destroy()
  }

  const setCodeMirrorContent = (newValue?: string) => {
    // Check whether CodeMirror is mounted properly.
    if (!codeMirror.value) {
      return
    }

    if (value.value === newValue) {
      // No need to update the content ref
      return
    }

    value.value = newValue ?? ''

    if (codeMirror.value.state.doc.toString() === value.value) {
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
          value.value.length,
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
