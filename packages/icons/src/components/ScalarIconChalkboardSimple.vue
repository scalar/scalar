/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconChalkboardSimple',
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
        d="M240,188h-4V160a12,12,0,0,0-12-12H160a12,12,0,0,0-12,12v28H44V60H212v60a12,12,0,0,0,24,0V56a20,20,0,0,0-20-20H40A20,20,0,0,0,20,56V188H16a12,12,0,0,0,0,24H240a12,12,0,0,0,0-24Zm-68-16h40v16H172Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M224,56V168H160v32H32V56a8,8,0,0,1,8-8H216A8,8,0,0,1,224,56Z"
        opacity="0.2" />
      <path
        d="M240,192h-8V168a8,8,0,0,0-8-8H160a8,8,0,0,0-8,8v24H40V56H216v80a8,8,0,0,0,16,0V56a16,16,0,0,0-16-16H40A16,16,0,0,0,24,56V192H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16Zm-72-16h48v16H168Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M240,192h-8V56a16,16,0,0,0-16-16H40A16,16,0,0,0,24,56V192H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16Zm-24,0H144V176a8,8,0,0,1,8-8h56a8,8,0,0,1,8,8Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M240,194H230V168a6,6,0,0,0-6-6H160a6,6,0,0,0-6,6v26H38V56a2,2,0,0,1,2-2H216a2,2,0,0,1,2,2v80a6,6,0,0,0,12,0V56a14,14,0,0,0-14-14H40A14,14,0,0,0,26,56V194H16a6,6,0,0,0,0,12H240a6,6,0,0,0,0-12Zm-74-20h52v20H166Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M240,192h-8V168a8,8,0,0,0-8-8H160a8,8,0,0,0-8,8v24H40V56H216v80a8,8,0,0,0,16,0V56a16,16,0,0,0-16-16H40A16,16,0,0,0,24,56V192H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16Zm-72-16h48v16H168Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M240,196H228V168a4,4,0,0,0-4-4H160a4,4,0,0,0-4,4v28H36V56a4,4,0,0,1,4-4H216a4,4,0,0,1,4,4v80a4,4,0,0,0,8,0V56a12,12,0,0,0-12-12H40A12,12,0,0,0,28,56V196H16a4,4,0,0,0,0,8H240a4,4,0,0,0,0-8Zm-76-24h56v24H164Z" />
    </g>
  </svg>
</template>
