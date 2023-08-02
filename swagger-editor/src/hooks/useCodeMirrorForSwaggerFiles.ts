import { json } from '@codemirror/lang-json'
import { StreamLanguage } from '@codemirror/language'
import { yaml } from '@codemirror/legacy-modes/mode/yaml'
import { type Extension } from '@codemirror/state'
import { EditorView, type ViewUpdate, lineNumbers } from '@codemirror/view'
import { awarenessStatesToArray } from '@hocuspocus/common'
import {
  type HocuspocusProvider,
  type StatesArray,
  type onAwarenessUpdateParameters,
} from '@hocuspocus/provider'
import { basicSetup } from 'codemirror'
import { type Ref, onUnmounted, ref, watch } from 'vue'
import { yCollab as CodeMirrorYjsBinding } from 'y-codemirror.next'
import * as Y from 'yjs'

import { useCodeMirror } from '@lib/hooks/useCodeMirror'
import { useHocuspocus } from '@lib/hooks/useHocuspocus'

export const useCodeMirrorForSwaggerFiles = ({
  documentName,
  token,
  onUpdate,
  onAwarenessUpdate,
}: {
  documentName?: Ref<string | undefined>
  token?: Ref<string | undefined>
  onUpdate?: (content: string) => void
  onAwarenessUpdate?: (states: StatesArray) => void
}) => {
  const provider: Ref<HocuspocusProvider | null> = ref(null)
  const currentContent = ref<string>('')
  const currentContentIsJson = ref<boolean>(true)

  // Watch for changes in the document name or token. If they change, we need to create a new Hocuspocus provider.
  watch(
    [documentName, token],
    () => {
      provider.value?.destroy()

      // No document name, no need for a Hocuspocus provider
      if (!documentName?.value) {
        return
      }

      provider.value = useHocuspocus({
        name: documentName?.value,
        token: token?.value,
        onAuthenticationFailed() {
          console.debug(
            `[useHocusPocus] ❌ Authentication with Hocuspocus failed (documentName: ${documentName.value})`,
          )
        },
        onAwarenessUpdate({ states }: onAwarenessUpdateParameters) {
          if (onAwarenessUpdate) {
            onAwarenessUpdate(states)
          }
        },
      }).provider

      provider.value?.on('authenticated', () => {
        const states = provider.value?.awareness.getStates()

        if (states) {
          if (onAwarenessUpdate) {
            onAwarenessUpdate(awarenessStatesToArray(states))
          }
        }
      })
    },
    { immediate: true },
  )

  // Watch for content changes to check if its JSON or YAML
  watch(
    () => currentContent.value,
    () => {
      try {
        JSON.parse(currentContent.value)
        currentContentIsJson.value = true
      } catch {
        currentContentIsJson.value = false
      }
    },
  )

  // Check if the content is JSON or YAML
  watch(
    () => currentContentIsJson.value,
    () => {
      reconfigureCodeMirror(getExtensions())
    },
  )

  // Check if the Hocuspocus provider is available
  watch(
    () => provider.value,
    () => {
      reconfigureCodeMirror(getExtensions())
    },
  )

  // Get the extensions for the editor
  const getExtensions = (): Extension[] => {
    const allExtensions = [
      EditorView.updateListener.of((v: ViewUpdate) => {
        if (v.docChanged) {
          currentContent.value = v.state.doc.toString()

          if (onUpdate) {
            onUpdate(v.state.doc.toString())
          }
        }
      }),
      basicSetup,
      lineNumbers(),
      currentContentIsJson.value ? json() : StreamLanguage.define(yaml),
    ]

    // Collaborative editing
    if (provider.value) {
      console.log('extensions with … collaborative editing')
      const ytext = provider.value?.document.getText('codemirror')

      allExtensions.push(
        CodeMirrorYjsBinding(ytext, provider.value.awareness, {
          undoManager: new Y.UndoManager(ytext),
        }),
      )
    } else {
      console.log('extensions without collaborative editing')
    }

    return allExtensions
  }

  const { codeMirrorRef, setCodeMirrorContent, reconfigureCodeMirror } =
    useCodeMirror({
      extensions: getExtensions(),
    })

  onUnmounted(() => {
    provider.value?.destroy()
  })

  return {
    provider,
    codeMirrorRef,
    setCodeMirrorContent,
    reconfigureCodeMirror,
  }
}
