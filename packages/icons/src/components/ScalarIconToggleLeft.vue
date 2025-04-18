/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconToggleLeft',
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
        d="M176,52H80a76,76,0,0,0,0,152h96a76,76,0,0,0,0-152Zm0,128H80A52,52,0,0,1,80,76h96a52,52,0,0,1,0,104ZM80,88a40,40,0,1,0,40,40A40,40,0,0,0,80,88Zm0,56a16,16,0,1,1,16-16A16,16,0,0,1,80,144Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M112,128A32,32,0,1,1,80,96,32,32,0,0,1,112,128Z"
        opacity="0.2" />
      <path
        d="M176,56H80a72,72,0,0,0,0,144h96a72,72,0,0,0,0-144Zm0,128H80A56,56,0,0,1,80,72h96a56,56,0,0,1,0,112ZM80,88a40,40,0,1,0,40,40A40,40,0,0,0,80,88Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,80,152Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M176,56H80a72,72,0,0,0,0,144h96a72,72,0,0,0,0-144ZM80,168a40,40,0,1,1,40-40A40,40,0,0,1,80,168Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M176,58H80a70,70,0,0,0,0,140h96a70,70,0,0,0,0-140Zm0,128H80A58,58,0,0,1,80,70h96a58,58,0,0,1,0,116ZM80,90a38,38,0,1,0,38,38A38,38,0,0,0,80,90Zm0,64a26,26,0,1,1,26-26A26,26,0,0,1,80,154Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M176,56H80a72,72,0,0,0,0,144h96a72,72,0,0,0,0-144Zm0,128H80A56,56,0,0,1,80,72h96a56,56,0,0,1,0,112ZM80,88a40,40,0,1,0,40,40A40,40,0,0,0,80,88Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,80,152Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M176,60H80a68,68,0,0,0,0,136h96a68,68,0,0,0,0-136Zm0,128H80A60,60,0,0,1,80,68h96a60,60,0,0,1,0,120ZM80,92a36,36,0,1,0,36,36A36,36,0,0,0,80,92Zm0,64a28,28,0,1,1,28-28A28,28,0,0,1,80,156Z" />
    </g>
  </svg>
</template>
