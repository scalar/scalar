/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconArrowUDownRight',
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
        d="M232.49,176.49l-48,48a12,12,0,0,1-17-17L195,180H88A68,68,0,0,1,88,44h88a12,12,0,0,1,0,24H88a44,44,0,0,0,0,88H195l-27.52-27.51a12,12,0,1,1,17-17l48,48A12,12,0,0,1,232.49,176.49Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M224,168l-48,48V120Z"
        opacity="0.2" />
      <path
        d="M229.66,162.34l-48-48A8,8,0,0,0,168,120v40H88a48,48,0,0,1,0-96h88a8,8,0,0,0,0-16H88a64,64,0,0,0,0,128h80v40a8,8,0,0,0,13.66,5.66l48-48A8,8,0,0,0,229.66,162.34ZM184,196.69V139.31L212.69,168Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M229.66,173.66l-48,48A8,8,0,0,1,168,216V176H88A64,64,0,0,1,88,48h88a8,8,0,0,1,0,16H88a48,48,0,0,0,0,96h80V120a8,8,0,0,1,13.66-5.66l48,48A8,8,0,0,1,229.66,173.66Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M228.24,172.24l-48,48a6,6,0,0,1-8.48-8.48L209.51,174H88A62,62,0,0,1,88,50h88a6,6,0,0,1,0,12H88a50,50,0,0,0,0,100H209.51l-37.75-37.76a6,6,0,0,1,8.48-8.48l48,48A6,6,0,0,1,228.24,172.24Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M229.66,173.66l-48,48a8,8,0,0,1-11.32-11.32L204.69,176H88A64,64,0,0,1,88,48h88a8,8,0,0,1,0,16H88a48,48,0,0,0,0,96H204.69l-34.35-34.34a8,8,0,0,1,11.32-11.32l48,48A8,8,0,0,1,229.66,173.66Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M226.83,170.83l-48,48a4,4,0,0,1-5.66-5.66L214.34,172H88A60,60,0,0,1,88,52h88a4,4,0,0,1,0,8H88a52,52,0,0,0,0,104H214.34l-41.17-41.17a4,4,0,0,1,5.66-5.66l48,48A4,4,0,0,1,226.83,170.83Z" />
    </g>
  </svg>
</template>
