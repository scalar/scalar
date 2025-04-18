/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconMapPinSimple',
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
        d="M188,72a60,60,0,1,0-72,58.79V232a12,12,0,0,0,24,0V130.79A60.09,60.09,0,0,0,188,72Zm-60,36a36,36,0,1,1,36-36A36,36,0,0,1,128,108Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M176,72a48,48,0,1,1-48-48A48,48,0,0,1,176,72Z"
        opacity="0.2" />
      <path
        d="M184,72a56,56,0,1,0-64,55.42V232a8,8,0,0,0,16,0V127.42A56.09,56.09,0,0,0,184,72Zm-56,40a40,40,0,1,1,40-40A40,40,0,0,1,128,112Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path d="M136,127.42V232a8,8,0,0,1-16,0V127.42a56,56,0,1,1,16,0Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M182,72a54,54,0,1,0-60,53.66V232a6,6,0,0,0,12,0V125.66A54.07,54.07,0,0,0,182,72Zm-54,42a42,42,0,1,1,42-42A42,42,0,0,1,128,114Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M184,72a56,56,0,1,0-64,55.42V232a8,8,0,0,0,16,0V127.42A56.09,56.09,0,0,0,184,72Zm-56,40a40,40,0,1,1,40-40A40,40,0,0,1,128,112Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M180,72a52,52,0,1,0-56,51.83V232a4,4,0,0,0,8,0V123.83A52.05,52.05,0,0,0,180,72Zm-52,44a44,44,0,1,1,44-44A44.05,44.05,0,0,1,128,116Z" />
    </g>
  </svg>
</template>
