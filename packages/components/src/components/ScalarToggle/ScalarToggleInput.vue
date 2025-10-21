<script lang="ts">
/**
 * Scalar Toggle Input component
 *
 * A create a toggle input component for use in forms.
 *
 * @example
 *  <ScalarToggleInput v-model="model" type="checkbox">
 *    Label
 *  </ScalarToggleInput>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { ScalarFormInput } from '../ScalarForm'
import ScalarToggle from './ScalarToggle.vue'

const model = defineModel<boolean>()

defineOptions({ inheritAttrs: false })
const { stylingAttrsCx, otherAttrs } = useBindCx()
</script>
<template>
  <ScalarFormInput
    is="label"
    v-bind="
      stylingAttrsCx('cursor-pointer gap-2 hover:bg-b-2', { 'text-c-1': model })
    ">
    <div class="flex-1 text-left min-w-0 truncate"><slot /></div>
    <ScalarToggle
      v-model="model"
      class="shrink-0"
      v-bind="otherAttrs" />
  </ScalarFormInput>
</template>
