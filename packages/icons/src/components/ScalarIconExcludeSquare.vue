/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconExcludeSquare',
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
        d="M228,160V96a12,12,0,0,0-12-12H172V40a12,12,0,0,0-12-12H40A12,12,0,0,0,28,40V96h0v64a12,12,0,0,0,12,12H84v44a12,12,0,0,0,12,12H216a12,12,0,0,0,12-12V160Zm-63,44-32-32H155l32,32ZM52,69l32,32V123L52,91ZM91,52l32,32H101L69,52Zm17,96V108h40v40Zm64,7V133l32,32V187Zm32-24-23-23h23ZM148,75,125,52h23ZM52,125l23,23H52Zm56,56,23,23H108Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M96,96v64H40V40H160V96Zm64,0v64H96v56H216V96Z"
        opacity="0.2" />
      <path
        d="M216,88H168V40a8,8,0,0,0-8-8H40a8,8,0,0,0-8,8V160a8,8,0,0,0,8,8H88v48a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V96A8,8,0,0,0,216,88ZM48,152V48H152V88H96a8,8,0,0,0-8,8v56Zm104-48v48H104V104Zm56,104H104V168h56a8,8,0,0,0,8-8V104h40Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M88,88v80H40a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8H160a8,8,0,0,1,8,8V88Zm128,0H168v80H88v48a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V96A8,8,0,0,0,216,88Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M216,90H166V40a6,6,0,0,0-6-6H40a6,6,0,0,0-6,6V160a6,6,0,0,0,6,6H90v50a6,6,0,0,0,6,6H216a6,6,0,0,0,6-6V96A6,6,0,0,0,216,90ZM162.48,210l-44-44h39l44,44ZM46,54.48l44,44v39l-44-44ZM93.52,46l44,44h-39l-44-44ZM102,154V102h52v52Zm64,3.52v-39l44,44v39Zm44-12L166.48,102H210Zm-56-56L110.48,46H154Zm-108,21L89.52,154H46Zm56,56L145.52,210H102Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M224,160V96a8,8,0,0,0-8-8H168V40a8,8,0,0,0-8-8H40a8,8,0,0,0-8,8V96h0v64a8,8,0,0,0,8,8H88v48a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V160Zm-60.69,48-40-40h33.38l40,40ZM48,59.31l40,40v33.38l-40-40ZM92.69,48l40,40H99.31l-40-40ZM104,152h0V104h48v48Zm64,4.69V123.31l40,40v33.38Zm40-16L171.31,104H208Zm-56-56L115.31,48H152ZM48,115.31,84.69,152H48Zm56,56L140.69,208H104Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M216,92H164V40a4,4,0,0,0-4-4H40a4,4,0,0,0-4,4V160a4,4,0,0,0,4,4H92v52a4,4,0,0,0,4,4H216a4,4,0,0,0,4-4V96A4,4,0,0,0,216,92ZM161.66,212l-48-48h44.68l48,48ZM44,49.66l48,48v44.68l-48-48ZM94.34,44l48,48H97.66l-48-48ZM100,156V100h56v56Zm64,2.34V113.66l48,48v44.68ZM212,100v50.34l-48-48V100Zm-56-8h-2.34l-48-48H156ZM44,156V105.66l48,48V156Zm56,8h2.34l48,48H100Z" />
    </g>
  </svg>
</template>
