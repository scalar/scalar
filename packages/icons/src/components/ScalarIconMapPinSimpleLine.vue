/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconMapPinSimpleLine',
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
        d="M216,204H140V138.79a60,60,0,1,0-24,0V204H40a12,12,0,0,0,0,24H216a12,12,0,0,0,0-24ZM92,80a36,36,0,1,1,36,36A36,36,0,0,1,92,80Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M176,80a48,48,0,1,1-48-48A48,48,0,0,1,176,80Z"
        opacity="0.2" />
      <path
        d="M216,208H136V135.42a56,56,0,1,0-16,0V208H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM88,80a40,40,0,1,1,40,40A40,40,0,0,1,88,80Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M224,216a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16h80V135.42a56,56,0,1,1,16,0V208h80A8,8,0,0,1,224,216Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M216,210H134V133.66a54,54,0,1,0-12,0V210H40a6,6,0,0,0,0,12H216a6,6,0,0,0,0-12ZM86,80a42,42,0,1,1,42,42A42,42,0,0,1,86,80Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M216,208H136V135.42a56,56,0,1,0-16,0V208H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM88,80a40,40,0,1,1,40,40A40,40,0,0,1,88,80Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M216,212H132V131.83a52,52,0,1,0-8,0V212H40a4,4,0,0,0,0,8H216a4,4,0,0,0,0-8ZM84,80a44,44,0,1,1,44,44A44.05,44.05,0,0,1,84,80Z" />
    </g>
  </svg>
</template>
