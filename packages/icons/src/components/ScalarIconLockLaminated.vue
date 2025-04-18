/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconLockLaminated',
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
        d="M208,76H180V56A52,52,0,0,0,76,56V76H48A20,20,0,0,0,28,96V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V96A20,20,0,0,0,208,76ZM52,144H204v16H52Zm48-88a28,28,0,0,1,56,0V76H100Zm104,44v20H52V100ZM52,204V184H204v20Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M216,96V208a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V96a8,8,0,0,1,8-8H208A8,8,0,0,1,216,96Z"
        opacity="0.2" />
      <path
        d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM48,128H208v16H48Zm0,32H208v16H48ZM96,56a32,32,0,0,1,64,0V80H96ZM208,96v16H48V96Zm0,112H48V192H208v16Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96Zm88,136H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm0-32H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm0-32H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M208,82H174V56a46,46,0,0,0-92,0V82H48A14,14,0,0,0,34,96V208a14,14,0,0,0,14,14H208a14,14,0,0,0,14-14V96A14,14,0,0,0,208,82ZM46,126H210v20H46Zm0,32H210v20H46ZM94,56a34,34,0,0,1,68,0V82H94ZM48,94H208a2,2,0,0,1,2,2v18H46V96A2,2,0,0,1,48,94ZM208,210H48a2,2,0,0,1-2-2V190H210v18A2,2,0,0,1,208,210Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM48,128H208v16H48Zm0,32H208v16H48ZM96,56a32,32,0,0,1,64,0V80H96ZM208,96v16H48V96Zm0,112H48V192H208v16Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M208,84H172V56a44,44,0,0,0-88,0V84H48A12,12,0,0,0,36,96V208a12,12,0,0,0,12,12H208a12,12,0,0,0,12-12V96A12,12,0,0,0,208,84ZM44,124H212v24H44Zm0,32H212v24H44ZM92,56a36,36,0,0,1,72,0V84H92ZM48,92H208a4,4,0,0,1,4,4v20H44V96A4,4,0,0,1,48,92ZM208,212H48a4,4,0,0,1-4-4V188H212v20A4,4,0,0,1,208,212Z" />
    </g>
  </svg>
</template>
