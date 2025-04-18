<script lang="ts">
/**
 * Scalar Text Area component
 *
 * A wrapper around the HTML textarea element with a focusable container.
 *
 * @example
 *   <ScalarTextArea v-model="model" />
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { useTextareaAutosize } from '@vueuse/core'
import { onMounted } from 'vue'

const model = defineModel<string>()

const { textarea } = useTextareaAutosize({
  input: model,
  styleProp: 'minHeight',
})

defineOptions({ inheritAttrs: false })
const { classCx, otherAttrs } = useBindCx()

onMounted(() => {
  // Force autofocus if the textarea has the autofocus attribute
  if ('autofocus' in otherAttrs.value) textarea.value?.focus()
})
</script>
<template>
  <div
    v-bind="
      classCx(
        'bg-b-1.5 custom-scroll flex min-h-0 shrink cursor-text items-center gap-0.75 rounded-md border px-3 py-2.5 outline-offset-[-1px] focus-within:bg-b-1 has-[input:focus-visible]:outline',
      )
    "
    @click="textarea?.focus()">
    <textarea
      ref="textarea"
      v-model="model"
      v-bind="otherAttrs"
      class="w-full resize-none border-none bg-transparent text-sm focus-within:outline-none" />
  </div>
</template>
