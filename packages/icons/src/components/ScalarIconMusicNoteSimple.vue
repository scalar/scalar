/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconMusicNoteSimple',
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
        d="M211.45,52.51l-80-24A12,12,0,0,0,116,40V140.22A52,52,0,1,0,140,184V56.13l64.55,19.36a12,12,0,1,0,6.9-23ZM88,212a28,28,0,1,1,28-28A28,28,0,0,1,88,212Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M128,184a40,40,0,1,1-40-40A40,40,0,0,1,128,184Z"
        opacity="0.2" />
      <path
        d="M210.3,56.34l-80-24A8,8,0,0,0,120,40V148.26A48,48,0,1,0,136,184V50.75l69.7,20.91a8,8,0,1,0,4.6-15.32ZM88,216a32,32,0,1,1,32-32A32,32,0,0,1,88,216Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M210.3,56.34l-80-24A8,8,0,0,0,120,40V148.26A48,48,0,1,0,136,184V50.75l69.7,20.91a8,8,0,1,0,4.6-15.32Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M209.72,58.25l-80-24A6,6,0,0,0,122,40V153.05A46,46,0,1,0,134,184V48.06l72.27,21.69a6,6,0,1,0,3.45-11.5ZM88,218a34,34,0,1,1,34-34A34,34,0,0,1,88,218Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M210.3,56.34l-80-24A8,8,0,0,0,120,40V148.26A48,48,0,1,0,136,184V50.75l69.7,20.91a8,8,0,1,0,4.6-15.32ZM88,216a32,32,0,1,1,32-32A32,32,0,0,1,88,216Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M209.15,60.17l-80-24A4,4,0,0,0,124,40V158.75A44,44,0,1,0,132,184V45.38l74.85,22.45a4,4,0,0,0,2.3-7.66ZM88,220a36,36,0,1,1,36-36A36,36,0,0,1,88,220Z" />
    </g>
  </svg>
</template>
