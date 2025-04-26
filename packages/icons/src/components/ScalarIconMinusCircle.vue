/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconMinusCircle',
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
        d="M180,128a12,12,0,0,1-12,12H88a12,12,0,0,1,0-24h80A12,12,0,0,1,180,128Zm56,0A108,108,0,1,1,128,20,108.12,108.12,0,0,1,236,128Zm-24,0a84,84,0,1,0-84,84A84.09,84.09,0,0,0,212,128Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z"
        opacity="0.2" />
      <path
        d="M176,128a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,128Zm56,0A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm40,112H88a8,8,0,0,1,0-16h80a8,8,0,0,1,0,16Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M174,128a6,6,0,0,1-6,6H88a6,6,0,0,1,0-12h80A6,6,0,0,1,174,128Zm56,0A102,102,0,1,1,128,26,102.12,102.12,0,0,1,230,128Zm-12,0a90,90,0,1,0-90,90A90.1,90.1,0,0,0,218,128Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M176,128a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,128Zm56,0A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M172,128a4,4,0,0,1-4,4H88a4,4,0,0,1,0-8h80A4,4,0,0,1,172,128Zm56,0A100,100,0,1,1,128,28,100.11,100.11,0,0,1,228,128Zm-8,0a92,92,0,1,0-92,92A92.1,92.1,0,0,0,220,128Z" />
    </g>
  </svg>
</template>
