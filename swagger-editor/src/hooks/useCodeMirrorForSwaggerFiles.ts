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
import { type Ref, computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { yCollab as CodeMirrorYjsBinding } from 'y-codemirror.next'
import * as Y from 'yjs'

import { useDarkModeState } from '@lib/hooks/useDarkModeState'

import { EditorClasses } from '@guide/styles'

const getRandomElement = (list: any) =>
  list[Math.floor(Math.random() * list.length)]

const { isDark } = useDarkModeState()

type UseCodeMirrorForSwaggerFilesParameters = {
  documentName?: Ref<string | undefined>
  token?: Ref<string | undefined>
  username?: string
  onUpdate?: (content: string) => void
  onAwarenessUpdate?: (states: StatesArray) => void
  /**
   * Always use dark mode.
   */
  forceDarkMode?: boolean
}

export const useCodeMirrorForSwaggerFiles = (
  parameters: UseCodeMirrorForSwaggerFilesParameters,
) => {
  const codeMirror = ref<EditorView | null>(null)
  const codeMirrorRef = ref<HTMLDivElement | null>(null)
  const currentContent = ref<string>('')
  let provider: HocuspocusProvider | null = null
  const {
    documentName,
    token,
    username,
    onUpdate,
    onAwarenessUpdate,
    forceDarkMode,
  } = parameters

  // Check if content is JSON
  const currentContentIsJson = computed(() => {
    try {
      JSON.parse(currentContent.value)
      return true
    } catch (e) {
      return false
    }
  })

  /**
   * Mount CodeMirror.
   */
  const mountCodeMirror = () => {
    // Clean up
    if (codeMirror.value) {
      codeMirror.value.destroy()
    }

    // Don’t mount, if there’s no codeMirrorRef
    if (!codeMirrorRef?.value) {
      return
    }

    // Add CodeMirror classes
    codeMirrorRef.value.classList.add(EditorClasses.CodeMirror)

    // Initialize CodeMirror
    const selectedTheme = isDark.value ? duotoneDark : duotoneLight
    const extensions = [
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
      currentContentIsJson.value ? json() : StreamLanguage.define(yaml),
    ]

    // Optional: collaborative editing
    if (provider) {
      const ytext = provider.document.getText('codemirror')

      extensions.push(
        CodeMirrorYjsBinding(ytext, provider.awareness, {
          undoManager: new Y.UndoManager(ytext),
        }),
      )
    }

    codeMirror.value = new EditorView({
      parent: codeMirrorRef?.value,
      extensions,
    })
  }

  /**
   * Watch documentName and token to create a new HocuspocusProvider.
   */
  onMounted(() => {
    watch(
      [documentName, token],
      () => {
        if (!documentName?.value) {
          mountCodeMirror()

          return
        }

        provider = new HocuspocusProvider({
          url: import.meta.env.VITE_HOCUS_POCUS as string,
          token: token?.value,
          name: documentName.value,
        })

        // Authenticated
        provider.on('authenticated', () => {
          console.debug(
            `[useHocusPocus] ✅ Authenticated with Hocuspocus (documentName: ${documentName.value})`,
          )

          // Pick a random color for the cursor
          const cursorColor = getRandomElement([
            '#958DF1',
            '#F98181',
            '#FBBC88',
            '#FAF594',
            '#70CFF8',
            '#94FADB',
            '#B9F18D',
          ])

          // Collaborative user settings
          provider?.setAwarenessField('user', {
            name: username,
            color: cursorColor,
            colorLight: cursorColor,
          })

          const states = provider?.awareness.getStates()

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

        mountCodeMirror()
      },
      { immediate: true },
    )
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
