/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconArrowElbowDownRight',
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
        d="M224.49,184.49l-48,48a12,12,0,0,1-17-17L187,188H72a12,12,0,0,1-12-12V32a12,12,0,0,1,24,0V164H187l-27.52-27.51a12,12,0,1,1,17-17l48,48A12,12,0,0,1,224.49,184.49Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M216,176l-48,48V128Z"
        opacity="0.2" />
      <path
        d="M221.66,170.34l-48-48A8,8,0,0,0,160,128v40H80V32a8,8,0,0,0-16,0V176a8,8,0,0,0,8,8h88v40a8,8,0,0,0,13.66,5.66l48-48A8,8,0,0,0,221.66,170.34ZM176,204.69V147.31L204.69,176Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M221.66,181.66l-48,48A8,8,0,0,1,160,224V184H72a8,8,0,0,1-8-8V32a8,8,0,0,1,16,0V168h80V128a8,8,0,0,1,13.66-5.66l48,48A8,8,0,0,1,221.66,181.66Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M220.24,180.24l-48,48a6,6,0,0,1-8.48-8.48L201.51,182H72a6,6,0,0,1-6-6V32a6,6,0,0,1,12,0V170H201.51l-37.75-37.76a6,6,0,1,1,8.48-8.48l48,48A6,6,0,0,1,220.24,180.24Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M221.66,181.66l-48,48a8,8,0,0,1-11.32-11.32L196.69,184H72a8,8,0,0,1-8-8V32a8,8,0,0,1,16,0V168H196.69l-34.35-34.34a8,8,0,0,1,11.32-11.32l48,48A8,8,0,0,1,221.66,181.66Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M218.83,178.83l-48,48a4,4,0,0,1-5.66-5.66L206.34,180H72a4,4,0,0,1-4-4V32a4,4,0,0,1,8,0V172H206.34l-41.17-41.17a4,4,0,1,1,5.66-5.66l48,48A4,4,0,0,1,218.83,178.83Z" />
    </g>
  </svg>
</template>
