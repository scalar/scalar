/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconCellSignalMedium',
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
        d="M132,112v88a12,12,0,0,1-24,0V112a12,12,0,0,1,24,0ZM80,140a12,12,0,0,0-12,12v48a12,12,0,0,0,24,0V152A12,12,0,0,0,80,140ZM40,180a12,12,0,0,0-12,12v8a12,12,0,0,0,24,0v-8A12,12,0,0,0,40,180Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M120,100.7V208H32a8,8,0,0,1-5.66-13.66Z"
        opacity="0.2" />
      <path
        d="M198.12,25.23a16,16,0,0,0-17.44,3.46l-160,160A16,16,0,0,0,32,216H192a16,16,0,0,0,16-16V40A15.94,15.94,0,0,0,198.12,25.23ZM112,120v80H32Zm80,80H128V104l64-64Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M198.12,25.23a16,16,0,0,0-17.44,3.46l-160,160A16,16,0,0,0,32,216H192a16,16,0,0,0,16-16V40A15.94,15.94,0,0,0,198.12,25.23ZM192,200H128V104l64-64Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M126,112v88a6,6,0,0,1-12,0V112a6,6,0,0,1,12,0ZM80,146a6,6,0,0,0-6,6v48a6,6,0,0,0,12,0V152A6,6,0,0,0,80,146ZM40,186a6,6,0,0,0-6,6v8a6,6,0,0,0,12,0v-8A6,6,0,0,0,40,186Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M128,112v88a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0ZM80,144a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V152A8,8,0,0,0,80,144ZM40,184a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-8A8,8,0,0,0,40,184Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M124,112v88a4,4,0,0,1-8,0V112a4,4,0,0,1,8,0ZM80,148a4,4,0,0,0-4,4v48a4,4,0,0,0,8,0V152A4,4,0,0,0,80,148ZM40,188a4,4,0,0,0-4,4v8a4,4,0,0,0,8,0v-8A4,4,0,0,0,40,188Z" />
    </g>
  </svg>
</template>
