/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconControl',
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
        d="M208.49,128.49a12,12,0,0,1-17,0L128,65,64.49,128.49a12,12,0,0,1-17-17l72-72a12,12,0,0,1,17,0l72,72A12,12,0,0,1,208.49,128.49Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M200,120H56l72-72Z"
        opacity="0.2" />
      <path
        d="M205.66,114.34l-72-72a8,8,0,0,0-11.32,0l-72,72A8,8,0,0,0,56,128H200a8,8,0,0,0,5.66-13.66ZM75.31,112,128,59.31,180.69,112Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M207.39,123.06A8,8,0,0,1,200,128H56a8,8,0,0,1-5.66-13.66l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,207.39,123.06Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M204.24,124.24a6,6,0,0,1-8.48,0L128,56.49,60.24,124.24a6,6,0,0,1-8.48-8.48l72-72a6,6,0,0,1,8.48,0l72,72A6,6,0,0,1,204.24,124.24Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M205.66,125.66a8,8,0,0,1-11.32,0L128,59.31,61.66,125.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,205.66,125.66Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M202.83,122.83a4,4,0,0,1-5.66,0L128,53.66,58.83,122.83a4,4,0,0,1-5.66-5.66l72-72a4,4,0,0,1,5.66,0l72,72A4,4,0,0,1,202.83,122.83Z" />
    </g>
  </svg>
</template>
