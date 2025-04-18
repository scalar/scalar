/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconCaretLineDown',
}
</script>
<script lang="ts" setup>
import { useScalarIcon } from '@/hooks'
import type { ScalarIconProps } from '@/types'

const props = defineProps<ScalarIconProps>()

const { bind, weight } = useScalarIcon(props)
</script>
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
    v-bind="bind">
    <slot />
    <g v-if="weight === 'bold'">
      <path
        d="M39.51,80.49a12,12,0,0,1,17-17L128,135l71.51-71.52a12,12,0,0,1,17,17l-80,80a12,12,0,0,1-17,0ZM208,180H48a12,12,0,0,0,0,24H208a12,12,0,0,0,0-24Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M208,72l-80,80L48,72Z"
        opacity="0.2" />
      <path
        d="M122.34,157.66a8,8,0,0,0,11.32,0l80-80A8,8,0,0,0,208,64H48a8,8,0,0,0-5.66,13.66ZM188.69,80,128,140.69,67.31,80ZM216,192a8,8,0,0,1-8,8H48a8,8,0,0,1,0-16H208A8,8,0,0,1,216,192Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M42.34,77.66A8,8,0,0,1,48,64H208a8,8,0,0,1,5.66,13.66l-80,80a8,8,0,0,1-11.32,0ZM208,184H48a8,8,0,0,0,0,16H208a8,8,0,0,0,0-16Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M43.76,76.24a6,6,0,0,1,8.48-8.48L128,143.51l75.76-75.75a6,6,0,0,1,8.48,8.48l-80,80a6,6,0,0,1-8.48,0ZM208,186H48a6,6,0,0,0,0,12H208a6,6,0,0,0,0-12Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M42.34,77.66A8,8,0,0,1,53.66,66.34L128,140.69l74.34-74.35a8,8,0,0,1,11.32,11.32l-80,80a8,8,0,0,1-11.32,0ZM208,184H48a8,8,0,0,0,0,16H208a8,8,0,0,0,0-16Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M45.17,74.83a4,4,0,0,1,5.66-5.66L128,146.34l77.17-77.17a4,4,0,1,1,5.66,5.66l-80,80a4,4,0,0,1-5.66,0ZM208,188H48a4,4,0,0,0,0,8H208a4,4,0,0,0,0-8Z" />
    </g>
  </svg>
</template>
