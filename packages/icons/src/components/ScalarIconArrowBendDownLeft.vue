/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconArrowBendDownLeft',
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
        d="M236,56A108.12,108.12,0,0,1,128,164H61l27.52,27.51a12,12,0,0,1-17,17l-48-48a12,12,0,0,1,0-17l48-48a12,12,0,0,1,17,17L61,140h67a84.09,84.09,0,0,0,84-84,12,12,0,0,1,24,0Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M80,104v96L32,152Z"
        opacity="0.2" />
      <path
        d="M224,48a8,8,0,0,0-8,8,88.1,88.1,0,0,1-88,88H88V104a8,8,0,0,0-13.66-5.66l-48,48a8,8,0,0,0,0,11.32l48,48A8,8,0,0,0,88,200V160h40A104.11,104.11,0,0,0,232,56,8,8,0,0,0,224,48ZM72,180.69,43.31,152,72,123.31Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M232,56A104.11,104.11,0,0,1,128,160H88v40a8,8,0,0,1-13.66,5.66l-48-48a8,8,0,0,1,0-11.32l48-48A8,8,0,0,1,88,104v40h40a88.1,88.1,0,0,0,88-88,8,8,0,0,1,16,0Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M230,56A102.12,102.12,0,0,1,128,158H46.49l37.75,37.76a6,6,0,1,1-8.48,8.48l-48-48a6,6,0,0,1,0-8.48l48-48a6,6,0,0,1,8.48,8.48L46.49,146H128a90.1,90.1,0,0,0,90-90,6,6,0,0,1,12,0Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M232,56A104.11,104.11,0,0,1,128,160H51.31l34.35,34.34a8,8,0,0,1-11.32,11.32l-48-48a8,8,0,0,1,0-11.32l48-48a8,8,0,0,1,11.32,11.32L51.31,144H128a88.1,88.1,0,0,0,88-88,8,8,0,0,1,16,0Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M228,56A100.11,100.11,0,0,1,128,156H41.66l41.17,41.17a4,4,0,0,1-5.66,5.66l-48-48a4,4,0,0,1,0-5.66l48-48a4,4,0,0,1,5.66,5.66L41.66,148H128a92.1,92.1,0,0,0,92-92,4,4,0,0,1,8,0Z" />
    </g>
  </svg>
</template>
