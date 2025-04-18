/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconGitCommit',
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
        d="M244,116H186.79a60,60,0,0,0-117.58,0H12a12,12,0,0,0,0,24H69.21a60,60,0,0,0,117.58,0H244a12,12,0,0,0,0-24ZM128,164a36,36,0,1,1,36-36A36,36,0,0,1,128,164Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M176,128a48,48,0,1,1-48-48A48,48,0,0,1,176,128Z"
        opacity="0.2" />
      <path
        d="M248,120H183.42a56,56,0,0,0-110.84,0H8a8,8,0,0,0,0,16H72.58a56,56,0,0,0,110.84,0H248a8,8,0,0,0,0-16ZM128,168a40,40,0,1,1,40-40A40,40,0,0,1,128,168Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M256,128a8,8,0,0,1-8,8H183.42a56,56,0,0,1-110.84,0H8a8,8,0,0,1,0-16H72.58a56,56,0,0,1,110.84,0H248A8,8,0,0,1,256,128Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M248,122H181.66a54,54,0,0,0-107.32,0H8a6,6,0,0,0,0,12H74.34a54,54,0,0,0,107.32,0H248a6,6,0,0,0,0-12ZM128,170a42,42,0,1,1,42-42A42,42,0,0,1,128,170Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M248,120H183.42a56,56,0,0,0-110.84,0H8a8,8,0,0,0,0,16H72.58a56,56,0,0,0,110.84,0H248a8,8,0,0,0,0-16ZM128,168a40,40,0,1,1,40-40A40,40,0,0,1,128,168Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M248,124H179.83a52,52,0,0,0-103.66,0H8a4,4,0,0,0,0,8H76.17a52,52,0,0,0,103.66,0H248a4,4,0,0,0,0-8ZM128,172a44,44,0,1,1,44-44A44.05,44.05,0,0,1,128,172Z" />
    </g>
  </svg>
</template>
