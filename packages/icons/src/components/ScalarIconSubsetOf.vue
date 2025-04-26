/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconSubsetOf',
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
        d="M212,208a12,12,0,0,1-12,12H48a12,12,0,0,1,0-24H200A12,12,0,0,1,212,208Zm-12-52H104a44,44,0,0,1,0-88h96a12,12,0,0,0,0-24H104a68,68,0,0,0,0,136h96a12,12,0,0,0,0-24Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M200,56V168H104a56,56,0,0,1,0-112Z"
        opacity="0.2" />
      <path
        d="M208,208a8,8,0,0,1-8,8H48a8,8,0,0,1,0-16H200A8,8,0,0,1,208,208Zm-8-48H104a48,48,0,0,1,0-96h96a8,8,0,0,0,0-16H104a64,64,0,0,0,0,128h96a8,8,0,0,0,0-16Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM176,184H80a8,8,0,0,1,0-16h96a8,8,0,0,1,0,16Zm-64-48h64a8,8,0,0,1,0,16H112a40,40,0,0,1,0-80h64a8,8,0,0,1,0,16H112a24,24,0,0,0,0,48Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M206,208a6,6,0,0,1-6,6H48a6,6,0,0,1,0-12H200A6,6,0,0,1,206,208Zm-6-46H104a50,50,0,0,1,0-100h96a6,6,0,0,0,0-12H104a62,62,0,0,0,0,124h96a6,6,0,0,0,0-12Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M208,208a8,8,0,0,1-8,8H48a8,8,0,0,1,0-16H200A8,8,0,0,1,208,208Zm-8-48H104a48,48,0,0,1,0-96h96a8,8,0,0,0,0-16H104a64,64,0,0,0,0,128h96a8,8,0,0,0,0-16Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M204,208a4,4,0,0,1-4,4H48a4,4,0,0,1,0-8H200A4,4,0,0,1,204,208Zm-4-44H104a52,52,0,0,1,0-104h96a4,4,0,0,0,0-8H104a60,60,0,0,0,0,120h96a4,4,0,0,0,0-8Z" />
    </g>
  </svg>
</template>
