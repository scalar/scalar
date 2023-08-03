import { type Extension } from '@codemirror/state'
import { type EditorViewConfig } from '@codemirror/view'
import { duotoneDark, duotoneLight } from '@uiw/codemirror-theme-duotone'
import { EditorView } from 'codemirror'
import { type Ref, ref, watch } from 'vue'

import { useDarkModeState } from './useDarkModeState'

const { isDark } = useDarkModeState()

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
   * The "type" where the content is stored in the Y.js document.
   */
  type?: string

  /**
   * Inverse the dark mode.
   */
  forceDarkMode?: boolean
}

export const useCodeMirror = (
  parameters: UseCodeMirrorParameters,
): {
  codeMirrorRef: Ref<HTMLDivElement | null>
  codeMirror: Ref<EditorView | null>
  setCodeMirrorContent: (content: string) => void
} => {
  const { extensions, content, forceDarkMode } = parameters
  const codeMirrorRef = ref<HTMLDivElement | null>(null)
  const codeMirror = ref<EditorView | null>(null)

  // Unmounts CodeMirror if it’s mounted already, and mounts CodeMirror, if the given ref exists.
  watch(codeMirrorRef, () => {
    destroyCodeMirror()
    mountCodeMirror()
  })

  // Initializes CodeMirror.
  const mountCodeMirror = () => {
    if (codeMirrorRef.value) {
      const configuration: EditorViewConfig = {
        parent: codeMirrorRef.value,
        extensions: addDefaultExtensions(extensions),
      }

      // Only set the content, when not in collaborative editing mode
      if (content !== undefined) {
        configuration.doc = content
      }

      codeMirror.value = new EditorView(configuration)
    }
  }

  // Extend the given extension list with a dark/light theme.
  const addDefaultExtensions = (newExtensions: Extension[]) => {
    return [
      EditorView.theme({}, { dark: forceDarkMode ? false : isDark.value }),
      forceDarkMode ? duotoneLight : isDark.value ? duotoneDark : duotoneLight,
      ...newExtensions,
    ]
  }

  // Replaces the current content with the given value.
  const setCodeMirrorContent = (value: string) => {
    if (!codeMirror.value) {
      return
    }

    codeMirror.value.dispatch({
      changes: {
        from: 0,
        to: codeMirror.value.state.doc.length,
        insert: value,
      },
      selection: {
        anchor: Math.min(
          codeMirror.value.state.selection.main.anchor,
          value.length,
        ),
      },
    })
  }

  // Removes CodeMirror.
  const destroyCodeMirror = () => {
    codeMirror.value?.destroy()
  }

  return {
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
  }
}
