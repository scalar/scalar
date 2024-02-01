<script setup lang="ts">
import { type Component, computed } from 'vue'

import { isRequestMethod, requestMethodColors } from '../fixtures'

const props = defineProps<{
  /** The type of element to render as, defaults to `div` */
  as?: Component | string
  /** The css property or variable that will be set to the request method color, defaults to `color` */
  property?: string
  /** The HTTP method to show */
  method: string
}>()

const uppercase = computed(() => props.method.toUpperCase())

const color = computed<string>(() => {
  if (isRequestMethod(uppercase.value))
    return requestMethodColors[uppercase.value]
  return 'var(--theme-color-ghost, var(--default-theme-color-ghost))'
})
</script>
<template>
  <component
    :is="as ?? 'div'"
    :style="{ [property ?? 'color']: color }">
    <slot v-bind="{ uppercase, color }">{{ uppercase }}</slot>
  </component>
</template>
