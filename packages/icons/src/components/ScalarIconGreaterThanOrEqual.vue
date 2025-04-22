/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconGreaterThanOrEqual',
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
        d="M51.85,148.74,173.29,104,51.85,59.26a12,12,0,0,1,8.3-22.52l152,56a12,12,0,0,1,0,22.52l-152,56a12,12,0,1,1-8.3-22.52ZM208,188H56a12,12,0,0,0,0,24H208a12,12,0,0,0,0-24Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M208,104,56,160V48Z"
        opacity="0.2" />
      <path
        d="M53.24,152.49,184.86,104,53.24,55.51a8,8,0,1,1,5.53-15l152,56a8,8,0,0,1,0,15l-152,56A8.13,8.13,0,0,1,56,168a8,8,0,0,1-2.76-15.51ZM208,192H56a8,8,0,0,0,0,16H208a8,8,0,0,0,0-16Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM184,184H80a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm2.35-64.35-104,32a8,8,0,1,1-4.7-15.3L156.8,112,77.65,87.65a8,8,0,0,1,4.7-15.3l104,32a8,8,0,0,1,0,15.3Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M53.93,154.37,190.64,104,53.93,53.63a6,6,0,1,1,4.15-11.26l152,56a6,6,0,0,1,0,11.26l-152,56A6.09,6.09,0,0,1,56,166a6,6,0,0,1-2.07-11.63ZM208,194H56a6,6,0,0,0,0,12H208a6,6,0,0,0,0-12Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M53.24,152.49,184.86,104,53.24,55.51a8,8,0,1,1,5.53-15l152,56a8,8,0,0,1,0,15l-152,56A8.13,8.13,0,0,1,56,168a8,8,0,0,1-2.76-15.51ZM208,192H56a8,8,0,0,0,0,16H208a8,8,0,0,0,0-16Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M54.62,156.25,196.43,104,54.62,51.75a4,4,0,0,1,2.76-7.5l152,56a4,4,0,0,1,0,7.5l-152,56A3.91,3.91,0,0,1,56,164a4,4,0,0,1-1.38-7.75ZM208,196H56a4,4,0,0,0,0,8H208a4,4,0,0,0,0-8Z" />
    </g>
  </svg>
</template>
