/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconDot',
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
      <path d="M144,128a16,16,0,1,1-16-16A16,16,0,0,1,144,128Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M176,128a48,48,0,1,1-48-48A48,48,0,0,1,176,128Z"
        opacity="0.2" />
      <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M128,80a48,48,0,1,0,48,48A48,48,0,0,0,128,80Zm0,60a12,12,0,1,1,12-12A12,12,0,0,1,128,140Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path d="M138,128a10,10,0,1,1-10-10A10,10,0,0,1,138,128Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path d="M136,128a8,8,0,1,1-8-8A8,8,0,0,1,136,128Z" />
    </g>
  </svg>
</template>
