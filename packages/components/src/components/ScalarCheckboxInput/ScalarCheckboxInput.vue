<script lang="ts">
/**
 * Scalar Checkbox Input component
 *
 * A wrapper around the HTML input element for either checkboxes or radio buttons.
 *
 * @example
 *  <ScalarCheckboxInput v-model="model" type="checkbox">
 *    Option Label
 *  </ScalarCheckboxInput>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { ScalarFormInput } from '../ScalarForm'
import ScalarCheckbox from './ScalarCheckbox.vue'
import type { ScalarCheckboxType } from './types'

const { type = 'checkbox' } = defineProps<{
  type?: ScalarCheckboxType
}>()

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
    <ScalarCheckbox
      :selected="model"
      :type
      class="shrink-0" />
    <div class="flex-1 text-left min-w-0 truncate"><slot /></div>
    <input
      :type
      v-model="model"
      class="sr-only"
      v-bind="otherAttrs" />
  </ScalarFormInput>
</template>
