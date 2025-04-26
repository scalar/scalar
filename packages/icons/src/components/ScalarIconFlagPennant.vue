/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconFlagPennant',
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
        d="M243.94,92.67l-184-64A12,12,0,0,0,44,40V216a12,12,0,0,0,24,0V176.53l175.94-61.2a12,12,0,0,0,0-22.66ZM68,151.12V56.88L203.47,104Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M240,104,56,168V40Z"
        opacity="0.2" />
      <path
        d="M242.63,96.44l-184-64A8,8,0,0,0,48,40V216a8,8,0,0,0,16,0V173.69l178.63-62.13a8,8,0,0,0,0-15.12ZM64,156.75V51.25L215.65,104Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M248,104a8,8,0,0,1-5.37,7.56L64,173.69V216a8,8,0,0,1-16,0V40a8,8,0,0,1,10.63-7.56l184,64A8,8,0,0,1,248,104Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M242,98.33l-184-64A6,6,0,0,0,50,40V216a6,6,0,0,0,12,0V172.27l180-62.6a6,6,0,0,0,0-11.34ZM62,159.56V48.44L221.74,104Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M242.63,96.44l-184-64A8,8,0,0,0,48,40V216a8,8,0,0,0,16,0V173.69l178.63-62.13a8,8,0,0,0,0-15.12ZM64,156.75V51.25L215.65,104Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M241.31,100.22l-184-64A4,4,0,0,0,52,40V216a4,4,0,0,0,8,0V170.84l181.31-63.06a4,4,0,0,0,0-7.56ZM60,162.37V45.63L227.82,104Z" />
    </g>
  </svg>
</template>
