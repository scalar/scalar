<script setup lang="ts">
import { type Component, computed } from 'vue'

import {
  isRequestMethod,
  requestMethodAbbreviations,
  requestMethodColors,
} from '../fixtures'

const props = defineProps<{
  /** The type of element to render as, defaults to `span` */
  as?: Component | string
  /** The css style property or variable that will be set to the request method color, defaults to `color` */
  property?: string
  /** Whether or not to abbreviated the slot content */
  short?: boolean
  /** The HTTP method to show */
  method: string
}>()

/** A trimmed and uppercase version of the method */
const normalized = computed(() => props.method.trim().toUpperCase())

const abbreviated = computed<string>(() => {
  if (isRequestMethod(normalized.value))
    return requestMethodAbbreviations[normalized.value]
  return normalized.value.slice(0, 4)
})
const color = computed<string>(() => {
  if (isRequestMethod(normalized.value))
    return requestMethodColors[normalized.value]
  return 'var(--scalar-color-ghost)'
})
</script>
<template>
  <component
    :is="as ?? 'span'"
    :style="{ [property || 'color']: color }">
    <slot v-bind="{ normalized, abbreviated, color }">{{
      short ? abbreviated : normalized
    }}</slot>
  </component>
</template>
