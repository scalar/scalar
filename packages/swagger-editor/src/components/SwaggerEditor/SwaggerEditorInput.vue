<script setup lang="ts">
import { useSwaggerEditor } from '@scalar/swagger-editor'
import { CodeMirror } from '@scalar/use-codemirror'
import { ref } from 'vue'

defineEmits<{
  (e: 'contentUpdate', value: string): void
}>()

const { extensions } = useSwaggerEditor()

defineExpose({
  setCodeMirrorContent: (value: string) => {
    codeMirrorRef.value?.setCodeMirrorContent(value)
  },
})

const codeMirrorRef = ref<typeof CodeMirror | null>(null)
</script>

<template>
  <div class="code-editor-input">
    <CodeMirror
      ref="codeMirrorRef"
      :extensions="extensions"
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
