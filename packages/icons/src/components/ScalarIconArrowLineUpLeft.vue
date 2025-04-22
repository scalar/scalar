/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconArrowLineUpLeft',
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
        d="M236,208a12,12,0,0,1-12,12H48a12,12,0,0,1,0-24H224A12,12,0,0,1,236,208ZM72,156a12,12,0,0,0,12-12V77l91.51,91.52a12,12,0,0,0,17-17L101,60h67a12,12,0,0,0,0-24H72A12,12,0,0,0,60,48v96A12,12,0,0,0,72,156Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M168,48,72,144V48Z"
        opacity="0.2" />
      <path
        d="M232,208a8,8,0,0,1-8,8H48a8,8,0,0,1,0-16H224A8,8,0,0,1,232,208ZM64,144V48a8,8,0,0,1,8-8h96a8,8,0,0,1,5.66,13.66L131.31,96l58.35,58.34a8,8,0,0,1-11.32,11.32L120,107.31,77.66,149.66A8,8,0,0,1,64,144Zm16-19.31,34.34-34.35h0L148.69,56H80Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M64,144V48a8,8,0,0,1,8-8h96a8,8,0,0,1,5.66,13.66L131.31,96l58.35,58.34a8,8,0,0,1-11.32,11.32L120,107.31,77.66,149.66A8,8,0,0,1,64,144Zm160,56H48a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M230,208a6,6,0,0,1-6,6H48a6,6,0,0,1,0-12H224A6,6,0,0,1,230,208ZM72,150a6,6,0,0,0,6-6V62.49L179.76,164.24a6,6,0,0,0,8.48-8.48L86.49,54H168a6,6,0,0,0,0-12H72a6,6,0,0,0-6,6v96A6,6,0,0,0,72,150Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M232,208a8,8,0,0,1-8,8H48a8,8,0,0,1,0-16H224A8,8,0,0,1,232,208ZM72,152a8,8,0,0,0,8-8V67.31l98.34,98.35a8,8,0,0,0,11.32-11.32L91.31,56H168a8,8,0,0,0,0-16H72a8,8,0,0,0-8,8v96A8,8,0,0,0,72,152Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M228,208a4,4,0,0,1-4,4H48a4,4,0,0,1,0-8H224A4,4,0,0,1,228,208ZM72,148a4,4,0,0,0,4-4V57.66L181.17,162.83a4,4,0,0,0,5.66-5.66L81.66,52H168a4,4,0,0,0,0-8H72a4,4,0,0,0-4,4v96A4,4,0,0,0,72,148Z" />
    </g>
  </svg>
</template>
