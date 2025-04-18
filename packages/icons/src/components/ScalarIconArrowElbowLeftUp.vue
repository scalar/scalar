/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconArrowElbowLeftUp',
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
        d="M244,192a12,12,0,0,1-12,12H88a12,12,0,0,1-12-12V77L48.49,104.49a12,12,0,0,1-17-17l48-48a12,12,0,0,1,17,0l48,48a12,12,0,0,1-17,17L100,77V180H232A12,12,0,0,1,244,192Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M136,96H40L88,48Z"
        opacity="0.2" />
      <path
        d="M232,184H96V104h40a8,8,0,0,0,5.66-13.66l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,40,104H80v88a8,8,0,0,0,8,8H232a8,8,0,0,0,0-16ZM88,59.31,116.69,88H59.31Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M240,192a8,8,0,0,1-8,8H88a8,8,0,0,1-8-8V104H40a8,8,0,0,1-5.66-13.66l48-48a8,8,0,0,1,11.32,0l48,48A8,8,0,0,1,136,104H96v80H232A8,8,0,0,1,240,192Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M238,192a6,6,0,0,1-6,6H88a6,6,0,0,1-6-6V62.49L44.24,100.24a6,6,0,0,1-8.48-8.48l48-48a6,6,0,0,1,8.48,0l48,48a6,6,0,1,1-8.48,8.48L94,62.49V186H232A6,6,0,0,1,238,192Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M240,192a8,8,0,0,1-8,8H88a8,8,0,0,1-8-8V67.31L45.66,101.66A8,8,0,0,1,34.34,90.34l48-48a8,8,0,0,1,11.32,0l48,48a8,8,0,0,1-11.32,11.32L96,67.31V184H232A8,8,0,0,1,240,192Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M236,192a4,4,0,0,1-4,4H88a4,4,0,0,1-4-4V57.66L42.83,98.83a4,4,0,0,1-5.66-5.66l48-48a4,4,0,0,1,5.66,0l48,48a4,4,0,0,1-5.66,5.66L92,57.66V188H232A4,4,0,0,1,236,192Z" />
    </g>
  </svg>
</template>
