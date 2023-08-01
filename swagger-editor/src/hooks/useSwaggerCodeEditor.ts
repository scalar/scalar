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
import { onUnmounted } from 'vue'

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

    addHocuspocusProvider(provider)
  }

  if (documentName) {
    configureHocuspocus({
      documentName: documentName,
      token,
    })
  }

  function getExtensions(
    language: 'json' | 'yaml',
    reconfigureCodeMirror: (newExtensions: Extension[]) => void,
  ) {
    return [
      EditorView.updateListener.of((v: ViewUpdate) => {
        if (v.docChanged) {
          if (onUpdate) {
            onUpdate(v.state.doc.toString())
          }

          try {
            JSON.parse(v.state.doc.toString())
            reconfigureCodeMirror(getExtensions('json', reconfigureCodeMirror))
          } catch {
            reconfigureCodeMirror(getExtensions('yaml', reconfigureCodeMirror))
          }
        }
      }),
      basicSetup,
      language === 'json' ? json() : StreamLanguage.define(yaml),
      lineNumbers(),
    ]
  }

  const {
    codeMirrorRef,
    setCodeMirrorContent,
    reconfigureCodeMirror,
    addHocuspocusProvider,
  } = useCodeMirror({
    provider,
    extensions: [
      EditorView.updateListener.of((v: ViewUpdate) => {
        if (v.docChanged) {
          if (onUpdate) {
            onUpdate(v.state.doc.toString())
          }

          try {
            JSON.parse(v.state.doc.toString())
            reconfigureCodeMirror(getExtensions('json', reconfigureCodeMirror))
          } catch (e) {
            reconfigureCodeMirror(getExtensions('yaml', reconfigureCodeMirror))
          }
        }
      }),
      basicSetup,
      json(),
      lineNumbers(),
      StreamLanguage.define(yaml),
    ],
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
