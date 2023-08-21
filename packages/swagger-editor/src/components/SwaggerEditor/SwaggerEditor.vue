<script lang="ts" setup>
import { type StatesArray } from '@hocuspocus/provider'
import { type SwaggerSpec, parseSwaggerFile } from '@scalar/swagger-parser'
import { useDebounceFn } from '@vueuse/core'
import { computed, ref } from 'vue'

import SwaggerEditorHeader from './SwaggerEditorHeader.vue'
import SwaggerEditorInput from './SwaggerEditorInput.vue'
import SwaggerEditorNotification from './SwaggerEditorNotification.vue'
import SwaggerEditorStatusBar from './SwaggerEditorStatusBar.vue'

defineProps<{
  documentName?: string
  token?: string
  username?: string
  hocusPocusUrl?: string
}>()

const emit = defineEmits<{
  (e: 'awarenessUpdate', states: StatesArray): void
  (e: 'contentUpdate', value: string): void
  (e: 'specUpdate', spec: SwaggerSpec): void
  (e: 'import', value: string): void
}>()

const parserError = ref<string>('')

const handleSpecUpdate = useDebounceFn((value) => {
  parseSwaggerFile(value)
    .then((spec: SwaggerSpec) => {
      parserError.value = ''

      emit('specUpdate', spec)
    })
    .catch((error) => {
      parserError.value = error.toString()
    })
})

const handleContentUpdate = (value: string) => {
  emit('contentUpdate', value)
  handleSpecUpdate(value)
}

// Keep track of the present users
const awarenessStates = ref<number>(0)
const handleAwarenessUpdate = (states: StatesArray) => {
  awarenessStates.value = states.length
}

// Import new content
const importHandler = (value: string) => {
  codeMirrorReference.value?.setCodeMirrorContent(value)
}

const codeMirrorReference = ref<typeof SwaggerEditorInput | null>(null)

const formattedError = computed(() => {
  // Handle YAMLExceptions
  if (parserError.value?.startsWith('YAMLException:')) {
    // Trim everything but the first line
    return parserError.value.split('\n')[0]
  }

  return parserError.value
})
</script>
<template>
  <div class="code-editor">
    <SwaggerEditorHeader @import="importHandler" />
    <SwaggerEditorNotification v-if="formattedError">
      {{ formattedError }}
    </SwaggerEditorNotification>
    <SwaggerEditorInput
      ref="codeMirrorReference"
      :documentName="documentName"
      :token="token"
      :username="username"
      :hocusPocusUrl="hocusPocusUrl"
      @awarenessUpdate="handleAwarenessUpdate"
      @contentUpdate="handleContentUpdate" />
    <SwaggerEditorStatusBar v-if="documentName">
      {{ awarenessStates }} user{{ awarenessStates === 1 ? '' : 's' }} online
    </SwaggerEditorStatusBar>
  </div>
</template>

<style scoped>
.code-editor {
  flex: 1 1 0%;
  min-width: 0;
  min-height: 0;
  height: 100vh;

  display: flex;
  flex-direction: column;
  overflow: auto;
  border-right: 1px solid var(--theme-border-color);
}
</style>
