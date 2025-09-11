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
import { ScalarIconCheck } from '@scalar/icons'
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { ScalarFormInput } from '../ScalarForm'

const model = defineModel<boolean>()

defineOptions({ inheritAttrs: false })
const { classCx, otherAttrs } = useBindCx()
</script>
<template>
  <ScalarFormInput
    is="label"
    v-bind="classCx('cursor-pointer gap-2')">
    <input
      type="checkbox"
      v-model="model"
      class="sr-only"
      v-bind="otherAttrs" />
    <div
      class="flex size-4 items-center justify-center p-0.75 rounded"
      :class="[
        model ? 'bg-c-accent text-b-1' : 'text-transparent shadow-border',
      ]">
      <ScalarIconCheck
        v-if="model"
        class="size-3"
        weight="bold" />
    </div>
    <div class="flex-1 text-left min-w-0 truncate"><slot /></div>
  </ScalarFormInput>
</template>
