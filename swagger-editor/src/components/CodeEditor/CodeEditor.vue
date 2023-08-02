<script lang="ts" setup>
import { type StatesArray } from '@hocuspocus/provider'
import { ref } from 'vue'

import CodeEditorHeader from './CodeEditorHeader.vue'
import CodeEditorInput from './CodeEditorInput.vue'
import CodeEditorNotification from './CodeEditorNotification.vue'
import CodeEditorStatusBar from './CodeEditorStatusBar.vue'

defineProps<{
  documentName?: string
  token?: string
  error: string
}>()

const emit = defineEmits<{
  (e: 'awarenessUpdate', states: StatesArray): void
  (e: 'contentUpdate', value: string): void
  (e: 'import', value: string): void
}>()

const handleContentUpdate = (value: string) => {
  emit('contentUpdate', value)
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

const codeMirrorReference = ref<typeof CodeEditorInput | null>(null)
</script>
<template>
  <div class="code-editor">
    <CodeEditorHeader @import="importHandler" />
    <CodeEditorNotification v-if="error">
      {{ error }}
    </CodeEditorNotification>
    <CodeEditorInput
      ref="codeMirrorReference"
      :documentName="documentName"
      :token="token"
      @awarenessUpdate="handleAwarenessUpdate"
      @contentUpdate="handleContentUpdate" />
    <CodeEditorStatusBar v-if="documentName">
      {{ awarenessStates }} user{{ awarenessStates === 1 ? '' : 's' }} online @
      {{ documentName }}
    </CodeEditorStatusBar>
  </div>
</template>

<style scoped>
.code-editor {
  flex: 1 1 0%;
  min-width: 0;
  min-height: 0;
  height: var(--document-height);

  display: flex;
  flex-direction: column;
  overflow: auto;
  border-right: var(--theme-border);
}
</style>
