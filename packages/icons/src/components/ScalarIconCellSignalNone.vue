/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconCellSignalNone',
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
      <path d="M52,192v8a12,12,0,0,1-24,0v-8a12,12,0,0,1,24,0Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M198.12,25.23a16,16,0,0,0-17.43,3.47l-160,160A16,16,0,0,0,32,216H192a16,16,0,0,0,16-16V40A16,16,0,0,0,198.12,25.23ZM192,200H32L192,40Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M198.12,25.23a16,16,0,0,0-17.44,3.46l-160,160A16,16,0,0,0,32,216H192a16,16,0,0,0,16-16V40A15.94,15.94,0,0,0,198.12,25.23ZM192,200H32L192,40Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path d="M46,192v8a6,6,0,0,1-12,0v-8a6,6,0,0,1,12,0Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path d="M48,192v8a8,8,0,0,1-16,0v-8a8,8,0,0,1,16,0Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path d="M44,192v8a4,4,0,0,1-8,0v-8a4,4,0,0,1,8,0Z" />
    </g>
  </svg>
</template>
