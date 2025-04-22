/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconSlideshow',
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
        d="M184,44H72A20,20,0,0,0,52,64V192a20,20,0,0,0,20,20H184a20,20,0,0,0,20-20V64A20,20,0,0,0,184,44Zm-4,144H76V68H180ZM244,56V200a12,12,0,0,1-24,0V56a12,12,0,0,1,24,0ZM36,56V200a12,12,0,0,1-24,0V56a12,12,0,0,1,24,0Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M200,64V192a8,8,0,0,1-8,8H64a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8H192A8,8,0,0,1,200,64Z"
        opacity="0.2" />
      <path
        d="M192,48H64A16,16,0,0,0,48,64V192a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64A16,16,0,0,0,192,48Zm0,144H64V64H192V192ZM240,56V200a8,8,0,0,1-16,0V56a8,8,0,0,1,16,0ZM32,56V200a8,8,0,0,1-16,0V56a8,8,0,0,1,16,0Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M208,64V192a16,16,0,0,1-16,16H64a16,16,0,0,1-16-16V64A16,16,0,0,1,64,48H192A16,16,0,0,1,208,64Zm24-16a8,8,0,0,0-8,8V200a8,8,0,0,0,16,0V56A8,8,0,0,0,232,48ZM24,48a8,8,0,0,0-8,8V200a8,8,0,0,0,16,0V56A8,8,0,0,0,24,48Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M192,50H64A14,14,0,0,0,50,64V192a14,14,0,0,0,14,14H192a14,14,0,0,0,14-14V64A14,14,0,0,0,192,50Zm2,142a2,2,0,0,1-2,2H64a2,2,0,0,1-2-2V64a2,2,0,0,1,2-2H192a2,2,0,0,1,2,2ZM238,56V200a6,6,0,0,1-12,0V56a6,6,0,0,1,12,0ZM30,56V200a6,6,0,0,1-12,0V56a6,6,0,0,1,12,0Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M192,48H64A16,16,0,0,0,48,64V192a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64A16,16,0,0,0,192,48Zm0,144H64V64H192V192ZM240,56V200a8,8,0,0,1-16,0V56a8,8,0,0,1,16,0ZM32,56V200a8,8,0,0,1-16,0V56a8,8,0,0,1,16,0Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M192,52H64A12,12,0,0,0,52,64V192a12,12,0,0,0,12,12H192a12,12,0,0,0,12-12V64A12,12,0,0,0,192,52Zm4,140a4,4,0,0,1-4,4H64a4,4,0,0,1-4-4V64a4,4,0,0,1,4-4H192a4,4,0,0,1,4,4ZM236,56V200a4,4,0,0,1-8,0V56a4,4,0,0,1,8,0ZM28,56V200a4,4,0,0,1-8,0V56a4,4,0,0,1,8,0Z" />
    </g>
  </svg>
</template>
