<script setup lang="ts">
import { HocuspocusProvider, type StatesArray } from '@hocuspocus/provider'
import { CodeMirror, type CodeMirrorLanguage } from '@scalar/use-codemirror'
import { ref, watch } from 'vue'
import { yCollab as yjsCodeMirrorBinding } from 'y-codemirror.next'
import * as Y from 'yjs'

import { isJsonString } from '../../helpers'
import { type SwaggerEditorInputProps } from '../../types'

const props = defineProps<SwaggerEditorInputProps>()

const emit = defineEmits<{
  (e: 'contentUpdate', value: string): void
  (e: 'awarenessUpdate', states: StatesArray): void
}>()

const getRandomElement = (list: any) =>
  list[Math.floor(Math.random() * list.length)]

let provider: HocuspocusProvider | null = null

const yCodeMirrorExtension = ref<any | null>(null)

defineExpose({
  setCodeMirrorContent: (value: string) => {
    codeMirrorRef.value?.setCodeMirrorContent(value)
  },
})

watch(
  () => props.hocuspocusConfiguration,
  () => {
    if (provider) {
      provider.destroy()
      yCodeMirrorExtension.value = null
    }

    if (!props.hocuspocusConfiguration) {
      return
    }

    const { username, ...HocuspocusProviderConfiguration } =
      props.hocuspocusConfiguration

    provider = new HocuspocusProvider({
      ...HocuspocusProviderConfiguration,
      onAuthenticated() {
        console.log(
          `[SwaggerEditor] ✅ onAuthentication (${HocuspocusProviderConfiguration?.name})`,
        )
      },
      onConnect() {
        console.log(
          `[SwaggerEditor] 🟢 onConnect (${HocuspocusProviderConfiguration?.name})`,
        )
      },
      onAuthenticationFailed() {
        console.log(
          `[SwaggerEditor] ❌ onAuthenticationFailed (${HocuspocusProviderConfiguration?.name})`,
        )
      },
      onDisconnect() {
        console.log(
          `[SwaggerEditor] ⚪️ onDisconnect (${HocuspocusProviderConfiguration?.name})`,
        )
      },
      onAwarenessUpdate({ states }) {
        emit('awarenessUpdate', states)
      },
    })

    provider?.on('authenticated', () => {
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
        name: username || 'guest',
        color: cursorColor,
        colorLight: cursorColor,
      })
    })

    const ytext = provider.document.getText('codemirror')
    const undoManager = new Y.UndoManager(ytext)

    yCodeMirrorExtension.value = yjsCodeMirrorBinding(
      ytext,
      provider.awareness,
      { undoManager },
    )
  },
  { immediate: true, deep: true },
)

const codeMirrorRef = ref<typeof CodeMirror | null>(null)

function getSyntaxHighlighting(content?: string): CodeMirrorLanguage[] {
  if (isJsonString(content)) {
    return ['json']
  }

  return ['yaml']
}
</script>

<template>
  <div class="swagger-editor-input">
    <CodeMirror
      ref="codeMirrorRef"
      :content="value"
      :extensions="yCodeMirrorExtension ? [yCodeMirrorExtension] : []"
      :languages="getSyntaxHighlighting(value)"
      lineNumbers
      :name="hocuspocusConfiguration?.name"
      @change="(value: string) => $emit('contentUpdate', value)" />
  </div>
</template>

<style>
.swagger-editor-input {
  height: 100%;
  overflow: hidden;
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.swagger-editor-input .cm-line:first-of-type:last-of-type:has(br):before {
  content: 'Paste your Swagger file here...';
  color: var(--theme-color-3, var(--default-theme-color-3));
  position: absolute;
  display: block;
  height: 23px;
}
</style>
