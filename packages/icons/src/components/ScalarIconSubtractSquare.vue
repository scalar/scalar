/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconSubtractSquare',
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
        d="M228,160V96a12,12,0,0,0-12-12H172V40a12,12,0,0,0-12-12H40A12,12,0,0,0,28,40V160a12,12,0,0,0,12,12H84v44a12,12,0,0,0,12,12H216a12,12,0,0,0,12-12V160Zm-63,44-32-32H155l32,32Zm7-49V133l32,32V187Zm32-24-23-23h23ZM52,52h96v52h0v44H52Zm56,129,23,23H108Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M216,96V216H96V160h64V96Z"
        opacity="0.2" />
      <path
        d="M216,88H168V40a8,8,0,0,0-8-8H40a8,8,0,0,0-8,8V160a8,8,0,0,0,8,8H88v48a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V96A8,8,0,0,0,216,88ZM48,48H152V152H48ZM208,208H104V168h56a8,8,0,0,0,8-8V104h40Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M216,88H168V40a8,8,0,0,0-8-8H40a8,8,0,0,0-8,8V160a8,8,0,0,0,8,8H88v48a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V96A8,8,0,0,0,216,88ZM48,48H152V152H48Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M216,90H166V40a6,6,0,0,0-6-6H40a6,6,0,0,0-6,6V160a6,6,0,0,0,6,6H90v50a6,6,0,0,0,6,6H216a6,6,0,0,0,6-6V96A6,6,0,0,0,216,90ZM162.48,210l-44-44h39l44,44ZM166,157.52v-39l44,44v39Zm44-12L166.48,102H210ZM46,46H154V154H46Zm56,120.48L145.52,210H102Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M224,160V96a8,8,0,0,0-8-8H168V40a8,8,0,0,0-8-8H40a8,8,0,0,0-8,8V160a8,8,0,0,0,8,8H88v48a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V160Zm-60.69,48-40-40h33.38l40,40ZM168,156.69V123.31l40,40v33.38Zm40-16L171.31,104H208ZM48,48H152v56h0v48H48Zm56,123.31L140.69,208H104Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M216,92H164V40a4,4,0,0,0-4-4H40a4,4,0,0,0-4,4V160a4,4,0,0,0,4,4H92v52a4,4,0,0,0,4,4H216a4,4,0,0,0,4-4V96A4,4,0,0,0,216,92ZM161.66,212l-48-48h44.68l48,48ZM164,158.34V113.66l48,48v44.68ZM212,100v50.34l-48-48V100ZM44,44H156V156H44Zm56,120h2.34l48,48H100Z" />
    </g>
  </svg>
</template>
