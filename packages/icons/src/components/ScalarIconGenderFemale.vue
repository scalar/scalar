/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconGenderFemale',
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
        d="M212,96a84,84,0,1,0-96,83.13V196H88a12,12,0,0,0,0,24h28v20a12,12,0,0,0,24,0V220h28a12,12,0,0,0,0-24H140V179.13A84.12,84.12,0,0,0,212,96ZM68,96a60,60,0,1,1,60,60A60.07,60.07,0,0,1,68,96Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M200,96a72,72,0,1,1-72-72A72,72,0,0,1,200,96Z"
        opacity="0.2" />
      <path
        d="M208,96a80,80,0,1,0-88,79.6V200H88a8,8,0,0,0,0,16h32v24a8,8,0,0,0,16,0V216h32a8,8,0,0,0,0-16H136V175.6A80.11,80.11,0,0,0,208,96ZM64,96a64,64,0,1,1,64,64A64.07,64.07,0,0,1,64,96Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M128,144a40,40,0,1,1,40-40A40,40,0,0,1,128,144ZM216,40V216a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V40A16,16,0,0,1,56,24H200A16,16,0,0,1,216,40ZM136,176V159.42a56,56,0,1,0-16,0V176H96a8,8,0,0,0,0,16h24v16a8,8,0,0,0,16,0V192h24a8,8,0,0,0,0-16Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M206,96a78,78,0,1,0-84,77.75V202H88a6,6,0,0,0,0,12h34v26a6,6,0,0,0,12,0V214h34a6,6,0,0,0,0-12H134V173.75A78.09,78.09,0,0,0,206,96ZM62,96a66,66,0,1,1,66,66A66.08,66.08,0,0,1,62,96Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M208,96a80,80,0,1,0-88,79.6V200H88a8,8,0,0,0,0,16h32v24a8,8,0,0,0,16,0V216h32a8,8,0,0,0,0-16H136V175.6A80.11,80.11,0,0,0,208,96ZM64,96a64,64,0,1,1,64,64A64.07,64.07,0,0,1,64,96Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M204,96a76,76,0,1,0-80,75.89V204H88a4,4,0,0,0,0,8h36v28a4,4,0,0,0,8,0V212h36a4,4,0,0,0,0-8H132V171.89A76.09,76.09,0,0,0,204,96ZM60,96a68,68,0,1,1,68,68A68.07,68.07,0,0,1,60,96Z" />
    </g>
  </svg>
</template>
