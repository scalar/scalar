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

import { ScalarFormInput } from '../ScalarForm'

const model = defineModel<string>()

const { textarea } = useTextareaAutosize({
  // @ts-expect-error - unexpected type mismatch
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
  <ScalarFormInput
    is="div"
    v-bind="classCx('custom-scroll flex text-c-1 min-h-0 shrink cursor-text')"
    @click="textarea?.focus()">
    <textarea
      ref="textarea"
      v-model="model"
      v-bind="otherAttrs"
      class="w-full resize-none border-none bg-transparent text-sm focus-within:outline-none" />
  </ScalarFormInput>
</template>
