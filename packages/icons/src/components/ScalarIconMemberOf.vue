/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconMemberOf',
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
        d="M200,140H61.08A68.1,68.1,0,0,0,128,196h72a12,12,0,0,1,0,24H128a92,92,0,0,1,0-184h72a12,12,0,0,1,0,24H128a68.1,68.1,0,0,0-66.92,56H200a12,12,0,0,1,0,24Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M200,48V208H128a80,80,0,0,1-80-80h0a80,80,0,0,1,80-80Z"
        opacity="0.2" />
      <path
        d="M200,136H56.46A72.08,72.08,0,0,0,128,200h72a8,8,0,0,1,0,16H128a88,88,0,0,1,0-176h72a8,8,0,0,1,0,16H128a72.08,72.08,0,0,0-71.54,64H200a8,8,0,0,1,0,16Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm-32,88a8,8,0,0,1,0,16H80.68A48.07,48.07,0,0,0,128,176h48a8,8,0,0,1,0,16H128a64,64,0,0,1,0-128h48a8,8,0,0,1,0,16H128a48.07,48.07,0,0,0-47.32,40Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M200,134H54.26A74.09,74.09,0,0,0,128,202h72a6,6,0,0,1,0,12H128a86,86,0,0,1,0-172h72a6,6,0,0,1,0,12H128a74.09,74.09,0,0,0-73.74,68H200a6,6,0,0,1,0,12Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M200,136H56.46A72.08,72.08,0,0,0,128,200h72a8,8,0,0,1,0,16H128a88,88,0,0,1,0-176h72a8,8,0,0,1,0,16H128a72.08,72.08,0,0,0-71.54,64H200a8,8,0,0,1,0,16Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M200,132H52.11A76.09,76.09,0,0,0,128,204h72a4,4,0,0,1,0,8H128a84,84,0,0,1,0-168h72a4,4,0,0,1,0,8H128a76.09,76.09,0,0,0-75.89,72H200a4,4,0,0,1,0,8Z" />
    </g>
  </svg>
</template>
