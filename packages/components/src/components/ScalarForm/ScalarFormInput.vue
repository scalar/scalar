<script lang="ts">
/**
 * Scalar form input base component
 *
 * Provides a base for styling scalar form inputs and buttons
 *
 * This is used internally by the ScalarTextInput component and others
 * If you want a text input consider using this component
 *
 * Renders a button by default can be used to render any kind of input or input wrapper
 *
 * @example
 * <ScalarFormInput  />
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import type { Component } from 'vue'

const { is = 'button' } = defineProps<{
  is?: string | Component
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    :is="is"
    :type="is === 'button' ? 'button' : undefined"
    v-bind="
      cx(
        'bg-b-1.5 flex items-center text-c-2 gap-0.75 rounded border px-3 py-2.5 outline-offset-[-1px] has-[:focus-visible]:outline',
        { 'hover:bg-b-2': is === 'button' },
      )
    ">
    <slot />
  </component>
</template>
