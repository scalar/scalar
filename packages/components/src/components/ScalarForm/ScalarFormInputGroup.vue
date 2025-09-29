<script lang="ts">
/**
 * Scalar Form Group component
 *
 * Groups a set of ScalarFormInput or their derived components.
 *
 * @example
 * <ScalarFormInputGroup>
 *     <!-- Inputs... -->
 * </ScalarFormInputGroup>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import type { Component } from 'vue'

import { useFormGroup } from './useFormGroups'

const { is = 'div' } = defineProps<{
  /** The element to render
   *
   * If you want to use the group outside of a ScalarFormField,
   * you can set this to 'fieldset'.
   *
   * @default 'div'
   */
  is?: string | Component
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

useFormGroup()
</script>
<template>
  <component
    :is="is"
    v-bind="cx('flex flex-col border rounded divide-y')">
    <slot />
  </component>
</template>
