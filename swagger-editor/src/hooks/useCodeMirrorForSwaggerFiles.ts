import { json } from '@codemirror/lang-json'
import { StreamLanguage } from '@codemirror/language'
import { yaml } from '@codemirror/legacy-modes/mode/yaml'
import { type Extension } from '@codemirror/state'
import { EditorView, type ViewUpdate, lineNumbers } from '@codemirror/view'
import { awarenessStatesToArray } from '@hocuspocus/common'
import {
  HocuspocusProvider,
  type StatesArray,
  type onAwarenessUpdateParameters,
} from '@hocuspocus/provider'
import { duotoneDark, duotoneLight } from '@uiw/codemirror-theme-duotone'
import { basicSetup } from 'codemirror'
import { type Ref, computed, onUnmounted, ref, watch } from 'vue'
import { yCollab as CodeMirrorYjsBinding } from 'y-codemirror.next'
import * as Y from 'yjs'

import { useDarkModeState } from '@lib/hooks/useDarkModeState'

type UseCodeMirrorForSwaggerFilesParameters = {
  documentName?: Ref<string | undefined>
  token?: Ref<string | undefined>
  onUpdate?: (content: string) => void
  onAwarenessUpdate?: (states: StatesArray) => void
  /**
   * Always use dark mode.
   */
  forceDarkMode?: boolean
}

const { isDark } = useDarkModeState()

export const useCodeMirrorForSwaggerFiles = (
  parameters: UseCodeMirrorForSwaggerFilesParameters,
) => {
  const codeMirror = ref<EditorView | null>(null)
  const codeMirrorRef = ref<HTMLDivElement | null>(null)
  const currentContent = ref<string>('')
  const { documentName, token, onUpdate, onAwarenessUpdate, forceDarkMode } =
    parameters

  /**
   * Watch documentName and token to create a new HocuspocusProvider.
   */
  watch([documentName, token], () => {
    if (!documentName?.value) {
      return
    }

    const provider = new HocuspocusProvider({
      url: import.meta.env.VITE_HOCUS_POCUS as string,
      token: token?.value,
      name: documentName.value,
      onAuthenticated() {
        console.log('✅ Authenticated!')
      },
      onAuthenticationFailed() {
        console.debug(
          `[useHocusPocus] ❌ Authentication with Hocuspocus failed (documentName: ${documentName.value})`,
        )
      },
    })

    // Authenticated
    provider.on('authenticated', () => {
      const states = provider.awareness.getStates()

      if (states) {
        if (onAwarenessUpdate) {
          onAwarenessUpdate(awarenessStatesToArray(states))
        }
      }
    })

    // Authentication failed
    provider.on('authenticationFailed', () => {
      console.debug(
        `[useHocusPocus] ❌ Authentication with Hocuspocus failed (documentName: ${documentName.value})`,
      )
    })

    // Awareness updates
    provider.on(
      'awarenessUpdate',
      ({ states }: onAwarenessUpdateParameters) => {
        if (onAwarenessUpdate) {
          onAwarenessUpdate(states)
        }
      },
    )

    // Don’t mount, if there’s no codeMirrorRef
    if (!codeMirrorRef?.value) {
      return
    }

    // Check if content is JSON
    const currentContentIsJson = computed(() => {
      try {
        JSON.parse(currentContent.value)
        return true
      } catch (e) {
        return false
      }
    })

    // Initialize CodeMirror
    const selectedTheme = isDark.value ? duotoneDark : duotoneLight
    const ytext = provider.document.getText('codemirror')

    codeMirror.value = new EditorView({
      parent: codeMirrorRef?.value,
      extensions: [
        EditorView.theme({}, { dark: forceDarkMode ? false : isDark.value }),
        forceDarkMode ? duotoneLight : selectedTheme,
        EditorView.updateListener.of((v: ViewUpdate) => {
          if (v.docChanged) {
            const content = v.state.doc.toString()

            currentContent.value = content

            if (onUpdate) {
              onUpdate(content)
            }
          }
        }),
        basicSetup,
        lineNumbers(),
        CodeMirrorYjsBinding(ytext, provider.awareness, {
          undoManager: new Y.UndoManager(ytext),
        }),
        currentContentIsJson.value ? json() : StreamLanguage.define(yaml),
      ],
    })
  })

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

  return {
    /**
     * The ref where CodeMirror is mounted.
     */
    codeMirrorRef,
    /**
     * Overwrite the current content of the CodeMirror editor.
     */
    setCodeMirrorContent,
  }
}
