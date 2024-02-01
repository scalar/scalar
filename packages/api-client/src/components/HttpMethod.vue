<script setup lang="ts">
import { type Component, computed } from 'vue'

import {
  isRequestMethod,
  requestMethodAbbreviations,
  requestMethodColors,
} from '../fixtures'

const props = defineProps<{
  /** The type of element to render as, defaults to `div` */
  as?: Component | string
  /** The css style property or variable that will be set to the request method color */
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
  return 'var(--theme-color-ghost, var(--default-theme-color-ghost))'
})

const style = computed<object>(() =>
  props.property ? { [props.property]: color.value } : {},
)
</script>
<template>
  <component
    :is="as ?? 'div'"
    :style="style">
    <slot v-bind="{ normalized, abbreviated, color }">{{
      short ? abbreviated : normalized
    }}</slot>
  </component>
</template>
