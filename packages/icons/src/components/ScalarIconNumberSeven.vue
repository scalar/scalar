/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconNumberSeven',
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
        d="M179.49,51.45l-48,160A12,12,0,0,1,120,220a11.82,11.82,0,0,1-3.45-.51,12,12,0,0,1-8-14.94L151.87,60H88a12,12,0,0,1,0-24h80a12,12,0,0,1,11.49,15.45Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M216,40V216a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V40A16,16,0,0,1,56,24H200A16,16,0,0,1,216,40Z"
        opacity="0.2" />
      <path
        d="M175.66,50.3l-48,160a8,8,0,0,1-15.32-4.6L157.25,56H88a8,8,0,0,1,0-16h80a8,8,0,0,1,7.66,10.3Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M200,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V40A16,16,0,0,0,200,24ZM167.53,74.69l-40,112a8,8,0,1,1-15.06-5.38L148.65,80H96a8,8,0,0,1,0-16h64a8,8,0,0,1,7.53,10.69Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M173.75,49.72l-48,160a6,6,0,1,1-11.5-3.45L159.94,54H88a6,6,0,0,1,0-12h80a6,6,0,0,1,5.75,7.72Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M175.66,50.3l-48,160a8,8,0,0,1-15.32-4.6L157.25,56H88a8,8,0,0,1,0-16h80a8,8,0,0,1,7.66,10.3Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M171.83,49.15l-48,160A4,4,0,0,1,120,212a3.82,3.82,0,0,1-1.15-.17,4,4,0,0,1-2.68-5L162.62,52H88a4,4,0,0,1,0-8h80a4,4,0,0,1,3.83,5.15Z" />
    </g>
  </svg>
</template>
