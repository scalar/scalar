/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconSubsetProperOf',
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
        d="M212,208a12,12,0,0,1-12,12H128a92,92,0,0,1,0-184h72a12,12,0,0,1,0,24H128a68,68,0,0,0,0,136h72A12,12,0,0,1,212,208Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M200,48V208H128a80,80,0,0,1-80-80h0a80,80,0,0,1,80-80Z"
        opacity="0.2" />
      <path
        d="M208,208a8,8,0,0,1-8,8H128a88,88,0,0,1,0-176h72a8,8,0,0,1,0,16H128a72,72,0,0,0,0,144h72A8,8,0,0,1,208,208Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM128,176h48a8,8,0,0,1,0,16H128a64,64,0,0,1,0-128h48a8,8,0,0,1,0,16H128a48,48,0,0,0,0,96Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M206,208a6,6,0,0,1-6,6H128a86,86,0,0,1,0-172h72a6,6,0,0,1,0,12H128a74,74,0,0,0,0,148h72A6,6,0,0,1,206,208Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M208,208a8,8,0,0,1-8,8H128a88,88,0,0,1,0-176h72a8,8,0,0,1,0,16H128a72,72,0,0,0,0,144h72A8,8,0,0,1,208,208Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M204,208a4,4,0,0,1-4,4H128a84,84,0,0,1,0-168h72a4,4,0,0,1,0,8H128a76,76,0,0,0,0,152h72A4,4,0,0,1,204,208Z" />
    </g>
  </svg>
</template>
