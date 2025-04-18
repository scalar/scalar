/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconHardDrive',
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
        d="M224,60H32A20,20,0,0,0,12,80v96a20,20,0,0,0,20,20H224a20,20,0,0,0,20-20V80A20,20,0,0,0,224,60Zm-4,112H36V84H220Zm-56-44a16,16,0,1,1,16,16A16,16,0,0,1,164,128Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M232,80v96a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H224A8,8,0,0,1,232,80Z"
        opacity="0.2" />
      <path
        d="M224,64H32A16,16,0,0,0,16,80v96a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V80A16,16,0,0,0,224,64Zm0,112H32V80H224v96Zm-24-48a12,12,0,1,1-12-12A12,12,0,0,1,200,128Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M224,64H32A16,16,0,0,0,16,80v96a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V80A16,16,0,0,0,224,64Zm-36,76a12,12,0,1,1,12-12A12,12,0,0,1,188,140Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M224,66H32A14,14,0,0,0,18,80v96a14,14,0,0,0,14,14H224a14,14,0,0,0,14-14V80A14,14,0,0,0,224,66Zm2,110a2,2,0,0,1-2,2H32a2,2,0,0,1-2-2V80a2,2,0,0,1,2-2H224a2,2,0,0,1,2,2Zm-28-48a10,10,0,1,1-10-10A10,10,0,0,1,198,128Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M224,64H32A16,16,0,0,0,16,80v96a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V80A16,16,0,0,0,224,64Zm0,112H32V80H224v96Zm-24-48a12,12,0,1,1-12-12A12,12,0,0,1,200,128Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M224,68H32A12,12,0,0,0,20,80v96a12,12,0,0,0,12,12H224a12,12,0,0,0,12-12V80A12,12,0,0,0,224,68Zm4,108a4,4,0,0,1-4,4H32a4,4,0,0,1-4-4V80a4,4,0,0,1,4-4H224a4,4,0,0,1,4,4Zm-32-48a8,8,0,1,1-8-8A8,8,0,0,1,196,128Z" />
    </g>
  </svg>
</template>
