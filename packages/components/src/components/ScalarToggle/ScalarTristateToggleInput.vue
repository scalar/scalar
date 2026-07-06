<script lang="ts">
/**
 * Scalar Tristate Toggle Input component
 *
 * A tristate toggle input component for use in forms, supporting an
 * additional "unset" state alongside on/off.
 *
 * @example
 *  <ScalarTristateToggleInput v-model="model">
 *    Label
 *  </ScalarTristateToggleInput>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { ScalarFormInput } from '../ScalarForm'
import ScalarTristateToggle from './ScalarTristateToggle.vue'

const model = defineModel<boolean | undefined>()

defineOptions({ inheritAttrs: false })
const { stylingAttrsCx, otherAttrs } = useBindCx()
</script>
<template>
  <ScalarFormInput
    is="label"
    v-bind="
      stylingAttrsCx('cursor-pointer gap-2 hover:bg-b-2', {
        'text-c-1': model !== undefined,
      })
    ">
    <div class="flex-1 text-left min-w-0 truncate"><slot /></div>
    <ScalarTristateToggle
      v-model="model"
      class="shrink-0"
      v-bind="otherAttrs" />
  </ScalarFormInput>
</template>
