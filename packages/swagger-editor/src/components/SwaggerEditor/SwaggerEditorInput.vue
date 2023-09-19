<script setup lang="ts">
import { HocuspocusProvider } from '@hocuspocus/provider'
import { CodeMirror } from '@scalar/use-codemirror'
import { ref, watch } from 'vue'
import { yCollab as yCodeMirror } from 'y-codemirror.next'
import * as Y from 'yjs'

import { useSwaggerEditor } from '../../hooks'
import { type SwaggerEditorInputProps } from '../../types'

const props = defineProps<SwaggerEditorInputProps>()

defineEmits<{
  (e: 'contentUpdate', value: string): void
}>()

const getRandomElement = (list: any) =>
  list[Math.floor(Math.random() * list.length)]

const { extensions } = useSwaggerEditor()

defineExpose({
  setCodeMirrorContent: (value: string) => {
    codeMirrorRef.value?.setCodeMirrorContent(value)
  },
})

let provider: HocuspocusProvider | null = null

const yCodeMirrorExtension = ref<any | null>(null)

watch(
  props,
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
          '[SwaggerEditor] ✅ onAuthentication',
          props.hocuspocusConfiguration,
        )
      },
      onAuthenticationFailed() {
        console.log(
          '[SwaggerEditor] ❌ onAuthenticationFailed',
          props.hocuspocusConfiguration,
        )
      },
      onStatus({ status }: { status: string }) {
        console.log('[SwaggerEditor] onStatus', status)
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

    yCodeMirrorExtension.value = yCodeMirror(ytext, provider.awareness, {
      undoManager,
    })
  },
  { immediate: true },
)

const codeMirrorRef = ref<typeof CodeMirror | null>(null)
</script>

<template>
  <div class="code-editor-input">
    <CodeMirror
      ref="codeMirrorRef"
      :extensions="
        [...extensions, yCodeMirrorExtension].filter((extension) => extensions)
      "
      :languages="['json']"
      lineNumbers
      @change="(value: string) => $emit('contentUpdate', value)" />
  </div>
</template>

<style>
.code-editor-input {
  height: 100%;
  overflow: hidden;
  background: var(--theme-background-2);
}
</style>
