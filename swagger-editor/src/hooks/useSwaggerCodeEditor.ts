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
import { onUnmounted, ref, watch } from 'vue'

import { useCodeMirror } from '@lib/hooks/useCodeMirror'
import { useHocuspocus } from '@lib/hooks/useHocuspocus'

export const useSwaggerCodeEditor = ({
  documentName,
  token,
  onUpdate,
  onAwarenessUpdate,
}: {
  documentName?: string
  token?: string
  onUpdate?: (content: string) => void
  onAwarenessUpdate?: (states: StatesArray) => void
}) => {
  let provider: HocuspocusProvider | null = null
  const currentContent = ref<string>('')
  const currentContentIsJson = ref<boolean>(true)

  const configureHocuspocus = (data: {
    documentName?: string
    token?: string
  }) => {
    const { documentName: newDocumentName, token: newToken } = data

    if (provider) {
      provider.destroy()
    }

    if (!newDocumentName) {
      return
    }

    provider = useHocuspocus({
      name: newDocumentName,
      token: newToken,
      onAuthenticated() {
        console.debug(
          `[useHocusPocus] ✅ Authenticated with Hocuspocus (documentName: ${newDocumentName})`,
        )

        const states = provider?.awareness.getStates()

        if (states) {
          if (onAwarenessUpdate) {
            onAwarenessUpdate(awarenessStatesToArray(states))
          }
        }
      },
      onAuthenticationFailed() {
        console.debug(
          `[useHocusPocus] ❌ Authentication with Hocuspocus failed (documentName: ${newDocumentName})`,
        )
      },
      onAwarenessUpdate({ states }: onAwarenessUpdateParameters) {
        if (onAwarenessUpdate) {
          onAwarenessUpdate(states)
        }
      },
    }).provider

    if (addHocuspocusProvider && provider) {
      addHocuspocusProvider(provider)
    }
  }

  if (documentName) {
    configureHocuspocus({
      documentName: documentName,
      token,
    })
  }

  // Watch for changes to check if its JSON or YAML
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

  // Get the extensions for the editor
  const getExtensions = (): Extension[] => {
    return [
      EditorView.updateListener.of((v: ViewUpdate) => {
        currentContent.value = v.state.doc.toString()

        if (v.docChanged) {
          if (onUpdate) {
            onUpdate(v.state.doc.toString())
          }
        }
      }),
      basicSetup,
      lineNumbers(),
      currentContentIsJson.value ? json() : StreamLanguage.define(yaml),
    ]
  }

  const {
    codeMirrorRef,
    setCodeMirrorContent,
    reconfigureCodeMirror,
    addHocuspocusProvider,
  } = useCodeMirror({
    provider,
    extensions: getExtensions(),
  })

  onUnmounted(() => {
    provider?.destroy()
  })

  return {
    provider,
    codeMirrorRef,
    setCodeMirrorContent,
    reconfigureCodeMirror,
    configureHocuspocus,
  }
}
