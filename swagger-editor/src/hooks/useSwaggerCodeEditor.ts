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

  if (documentName) {
    provider = useHocuspocus({
      name: documentName,
      token,
      onAuthenticated() {
        console.debug(
          `[useHocusPocus] ✅ Authenticated with Hocuspocus (documentName: ${documentName})`,
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
          `[useHocusPocus] ❌ Authentication with Hocuspocus failed (documentName: ${documentName})`,
        )
      },
      onAwarenessUpdate({ states }: onAwarenessUpdateParameters) {
        if (onAwarenessUpdate) {
          onAwarenessUpdate(states)
        }
      },
    }).provider
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

  const { codeMirrorRef, setCodeMirrorContent, reconfigureCodeMirror } =
    useCodeMirror({
      provider,
      extensions: [
        EditorView.updateListener.of((v: ViewUpdate) => {
          if (v.docChanged) {
            if (onUpdate) {
              onUpdate(v.state.doc.toString())
            }

            try {
              JSON.parse(v.state.doc.toString())
              reconfigureCodeMirror(
                getExtensions('json', reconfigureCodeMirror),
              )
            } catch (e) {
              reconfigureCodeMirror(
                getExtensions('yaml', reconfigureCodeMirror),
              )
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
  }
}
