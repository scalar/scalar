/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconSquareLogo',
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
        d="M208,28H48A20,20,0,0,0,28,48V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V48A20,20,0,0,0,208,28Zm-4,176H52V52H204ZM96,172h64a12,12,0,0,0,12-12V96a12,12,0,0,0-12-12H96A12,12,0,0,0,84,96v64A12,12,0,0,0,96,172Zm12-64h40v40H108Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M160,96v64H96V96Z"
        opacity="0.2" />
      <path
        d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208ZM160,88H96a8,8,0,0,0-8,8v64a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V96A8,8,0,0,0,160,88Zm-8,64H104V104h48Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208ZM168,96v64a8,8,0,0,1-8,8H96a8,8,0,0,1-8-8V96a8,8,0,0,1,8-8h64A8,8,0,0,1,168,96Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M208,34H48A14,14,0,0,0,34,48V208a14,14,0,0,0,14,14H208a14,14,0,0,0,14-14V48A14,14,0,0,0,208,34Zm2,174a2,2,0,0,1-2,2H48a2,2,0,0,1-2-2V48a2,2,0,0,1,2-2H208a2,2,0,0,1,2,2ZM160,90H96a6,6,0,0,0-6,6v64a6,6,0,0,0,6,6h64a6,6,0,0,0,6-6V96A6,6,0,0,0,160,90Zm-6,64H102V102h52Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208ZM160,88H96a8,8,0,0,0-8,8v64a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V96A8,8,0,0,0,160,88Zm-8,64H104V104h48Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M208,36H48A12,12,0,0,0,36,48V208a12,12,0,0,0,12,12H208a12,12,0,0,0,12-12V48A12,12,0,0,0,208,36Zm4,172a4,4,0,0,1-4,4H48a4,4,0,0,1-4-4V48a4,4,0,0,1,4-4H208a4,4,0,0,1,4,4ZM160,92H96a4,4,0,0,0-4,4v64a4,4,0,0,0,4,4h64a4,4,0,0,0,4-4V96A4,4,0,0,0,160,92Zm-4,64H100V100h56Z" />
    </g>
  </svg>
</template>
