<script setup lang="ts">
import { useCodeMirror } from '@scalar/use-codemirror'
import { ref, watch } from 'vue'

const { modelValue } = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:value', value: string): void
}>()

const codeMirrorRef = ref<HTMLDivElement | null>(null)

watch(
  () => modelValue,
  (newValue) => {
    setCodeMirrorContent(newValue)
  },
)

const { setCodeMirrorContent } = useCodeMirror({
  codeMirrorRef,
  content: modelValue,
  language: 'html',
  lint: true,
  forceFoldGutter: true,
  onChange: (newValue) => emit('update:value', newValue),
})
</script>

<template>
  <div
    ref="codeMirrorRef"
    class="codemirror rounded-md" />
</template>

<style scoped>
.codemirror {
  color: var(--scalar-color-text);
  font-size: var(--scalar-small);
  overflow: auto;
}

:deep(.cm-editor) {
  padding: 10px 0;
}
</style>
