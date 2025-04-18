/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconLetterCircleH',
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
        d="M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20Zm0,192a84,84,0,1,1,84-84A84.09,84.09,0,0,1,128,212ZM172,88v80a12,12,0,0,1-24,0V140H108v28a12,12,0,0,1-24,0V88a12,12,0,0,1,24,0v28h40V88a12,12,0,0,1,24,0Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z"
        opacity="0.2" />
      <path
        d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM168,88v80a8,8,0,0,1-16,0V136H104v32a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0v32h48V88a8,8,0,0,1,16,0Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm40,144a8,8,0,0,1-16,0V136H104v32a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0v32h48V88a8,8,0,0,1,16,0Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M128,26A102,102,0,1,0,230,128,102.12,102.12,0,0,0,128,26Zm0,192a90,90,0,1,1,90-90A90.1,90.1,0,0,1,128,218ZM166,88v80a6,6,0,0,1-12,0V134H102v34a6,6,0,0,1-12,0V88a6,6,0,0,1,12,0v34h52V88a6,6,0,0,1,12,0Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM168,88v80a8,8,0,0,1-16,0V136H104v32a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0v32h48V88a8,8,0,0,1,16,0Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M128,28A100,100,0,1,0,228,128,100.11,100.11,0,0,0,128,28Zm0,192a92,92,0,1,1,92-92A92.1,92.1,0,0,1,128,220ZM164,88v80a4,4,0,0,1-8,0V132H100v36a4,4,0,0,1-8,0V88a4,4,0,0,1,8,0v36h56V88a4,4,0,0,1,8,0Z" />
    </g>
  </svg>
</template>
