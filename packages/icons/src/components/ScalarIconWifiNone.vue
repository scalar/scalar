/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconWifiNone',
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
      <path d="M144,204a16,16,0,1,1-16-16A16,16,0,0,1,144,204Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M247.89,80.91a15.93,15.93,0,0,0-6.17-10.81A186.67,186.67,0,0,0,128,32,186.67,186.67,0,0,0,14.28,70.1,15.93,15.93,0,0,0,8.11,80.91,15.65,15.65,0,0,0,11.65,92.8l104,125.43A15.93,15.93,0,0,0,128,224h0a15.93,15.93,0,0,0,12.31-5.77h0l104-125.43A15.65,15.65,0,0,0,247.89,80.91ZM128,208,24.09,82.74A170.76,170.76,0,0,1,128,48,170.76,170.76,0,0,1,231.91,82.74Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M247.89,80.91a15.93,15.93,0,0,0-6.17-10.81A186.67,186.67,0,0,0,128,32,186.67,186.67,0,0,0,14.28,70.1,15.93,15.93,0,0,0,8.11,80.91,15.65,15.65,0,0,0,11.65,92.8l104,125.43A15.93,15.93,0,0,0,128,224h0a15.93,15.93,0,0,0,12.31-5.77h0l104-125.43A15.65,15.65,0,0,0,247.89,80.91ZM128,208,24.09,82.74A170.76,170.76,0,0,1,128,48,170.76,170.76,0,0,1,231.91,82.74Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path d="M138,204a10,10,0,1,1-10-10A10,10,0,0,1,138,204Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path d="M140,204a12,12,0,1,1-12-12A12,12,0,0,1,140,204Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path d="M136,204a8,8,0,1,1-8-8A8,8,0,0,1,136,204Z" />
    </g>
  </svg>
</template>
