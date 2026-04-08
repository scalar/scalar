<script setup lang="ts">
import { javascript } from '@codemirror/lang-javascript'
import { useCodeMirror } from '@scalar/use-codemirror'
import { ref, toRef } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const codeMirrorRef = ref<HTMLDivElement | null>(null)

useCodeMirror({
  codeMirrorRef,
  content: toRef(() => props.modelValue),
  language: undefined,
  // We want to use some custom configuration for the syntax highlighting.
  extensions: [javascript()],
  lineNumbers: true,
  onChange: (value) => {
    emit('update:modelValue', value)
  },
})
</script>

<template>
  <div class="script-editor text-sm">
    <div
      ref="codeMirrorRef"
      class="editor-container" />
  </div>
</template>
