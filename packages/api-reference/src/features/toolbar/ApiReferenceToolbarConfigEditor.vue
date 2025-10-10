<script lang="ts" setup>
import { ScalarCodeBlockCopy } from '@scalar/components'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { useCodeMirror } from '@scalar/use-codemirror'
import { ref, watch } from 'vue'

/** The current configuration as an object */
const model = defineModel<Partial<ApiReferenceConfiguration>>()

/** The raw string content of the editor */
const content = ref<string>('')

/** A copy of the parsed content */
const parsed = ref<{}>({})

/** Try to parse the content on change */
function onChange(value: string) {
  content.value = value
  try {
    parsed.value = JSON.parse(value || '{}')
    // Only update the model if it's actually different
    if (JSON.stringify(parsed.value) !== JSON.stringify(model.value)) {
      model.value = parsed.value
    }
  } catch (e) {
    // Invalid JSON, don't emit an update
    return
  }
}

/** If the configuration is changed externally update the content */
watch(
  model,
  (config) => {
    // Only update the editor content if it's actually different
    if (config && JSON.stringify(config) !== JSON.stringify(parsed.value)) {
      content.value = prettyPrintJson(config)
    }
  },
  {
    immediate: true,
    deep: true,
  },
)

const codeMirrorRef = ref<HTMLDivElement | null>(null)

useCodeMirror({
  content,
  onChange,
  classes: ['max-h-60 *:overscroll-none'],
  codeMirrorRef,
  lineNumbers: true,
  language: 'json',
  lint: true,
})
</script>
<template>
  <div
    ref="codeMirrorRef"
    class="group/input group/code-block font-code relative rounded border text-sm whitespace-nowrap has-[:focus-visible]:outline">
    <div
      class="z-context text-c-2 absolute right-1.5 bottom-1 hidden font-sans group-has-[:focus-visible]/input:block"
      role="alert">
      Press
      <kbd class="-mx-0.25 rounded border px-0.5 font-mono">Esc</kbd> then
      <kbd class="-mx-0.25 rounded border px-0.5 font-mono">Tab</kbd> to exit
    </div>
    <ScalarCodeBlockCopy
      class="absolute inset-x-0 z-1 h-0 opacity-100 *:!top-1 *:!right-1"
      :content />
  </div>
</template>
