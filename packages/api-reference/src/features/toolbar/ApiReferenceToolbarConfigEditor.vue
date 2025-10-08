<script lang="ts" setup>
import { useCodeMirror } from '@scalar/use-codemirror'
import { ref } from 'vue'

const model = defineModel<string>()

const codeMirrorRef = ref<HTMLDivElement | null>(null)

useCodeMirror({
  content: model,
  onChange: (value) => (model.value = value),
  classes: ['h-60 *:overscroll-none'],
  codeMirrorRef,
  disableTabIndent: true,
  lineNumbers: true,
  language: 'json',
  lint: true,
})
</script>
<template>
  <div
    ref="codeMirrorRef"
    class="group/input font-code relative rounded border text-sm whitespace-nowrap has-[:focus-visible]:outline">
    <div
      class="z-context text-c-2 absolute right-1.5 bottom-1 hidden font-sans group-has-[:focus-visible]/input:block"
      role="alert">
      Press
      <kbd class="-mx-0.25 rounded border px-0.5 font-mono">Esc</kbd> then
      <kbd class="-mx-0.25 rounded border px-0.5 font-mono">Tab</kbd> to exit
    </div>
  </div>
</template>
