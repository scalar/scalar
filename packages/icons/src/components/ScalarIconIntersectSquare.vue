/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconIntersectSquare',
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
        d="M216,84H172V40a12,12,0,0,0-12-12H40A12,12,0,0,0,28,40V160a12,12,0,0,0,12,12H84v44a12,12,0,0,0,12,12H216a12,12,0,0,0,12-12V96A12,12,0,0,0,216,84ZM52,148V52h96V84H96A12,12,0,0,0,84,96v52Zm56-23,23,23H108ZM148,131l-23-23h23Zm56,73H108V172h52a12,12,0,0,0,12-12V108h32Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M160,96v64H96V96Z"
        opacity="0.2" />
      <path
        d="M216,88H168V40a8,8,0,0,0-8-8H40a8,8,0,0,0-8,8V160a8,8,0,0,0,8,8H88v48a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V96A8,8,0,0,0,216,88ZM48,152V48H152V88H96a8,8,0,0,0-8,8v56Zm104-48v48H104V104Zm56,104H104V168h56a8,8,0,0,0,8-8V104h40Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M216,88H168V40a8,8,0,0,0-8-8H40a8,8,0,0,0-8,8V160a8,8,0,0,0,8,8H88v48a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V96A8,8,0,0,0,216,88ZM48,152V48H152V88H96a8,8,0,0,0-8,8v56Zm160,56H104V168h56a8,8,0,0,0,8-8V104h40Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M216,90H166V40a6,6,0,0,0-6-6H40a6,6,0,0,0-6,6V160a6,6,0,0,0,6,6H90v50a6,6,0,0,0,6,6H216a6,6,0,0,0,6-6V96A6,6,0,0,0,216,90ZM46,154V46H154V90H96a6,6,0,0,0-6,6v58Zm56-43.52L145.52,154H102Zm52,35L110.48,102H154ZM210,210H102V166h58a6,6,0,0,0,6-6V102h44Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M216,88H168V40a8,8,0,0,0-8-8H40a8,8,0,0,0-8,8V160a8,8,0,0,0,8,8H88v48a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V96A8,8,0,0,0,216,88ZM48,152V48H152V88H96a8,8,0,0,0-8,8v56Zm56-36.69L140.69,152H104Zm48,25.38L115.31,104H152ZM208,208H104V168h56a8,8,0,0,0,8-8V104h40Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M216,92H164V40a4,4,0,0,0-4-4H40a4,4,0,0,0-4,4V160a4,4,0,0,0,4,4H92v52a4,4,0,0,0,4,4H216a4,4,0,0,0,4-4V96A4,4,0,0,0,216,92ZM44,156V44H156V92H96a4,4,0,0,0-4,4v60Zm56-50.34L150.34,156H100Zm56,44.68L105.66,100H156ZM212,212H100V164h60a4,4,0,0,0,4-4V100h48Z" />
    </g>
  </svg>
</template>
