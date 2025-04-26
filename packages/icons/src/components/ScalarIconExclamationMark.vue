/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconExclamationMark',
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
        d="M148,200a20,20,0,1,1-20-20A20,20,0,0,1,148,200Zm-20-40a12,12,0,0,0,12-12V48a12,12,0,0,0-24,0V148A12,12,0,0,0,128,160Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M216,40V216a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V40A16,16,0,0,1,56,24H200A16,16,0,0,1,216,40Z"
        opacity="0.2" />
      <path
        d="M144,200a16,16,0,1,1-16-16A16,16,0,0,1,144,200Zm-16-40a8,8,0,0,0,8-8V48a8,8,0,0,0-16,0V152A8,8,0,0,0,128,160Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M200,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V40A16,16,0,0,0,200,24ZM128,160a12,12,0,1,1-12,12A12,12,0,0,1,128,160Zm-8-24V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M142,200a14,14,0,1,1-14-14A14,14,0,0,1,142,200Zm-14-42a6,6,0,0,0,6-6V48a6,6,0,0,0-12,0V152A6,6,0,0,0,128,158Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M144,200a16,16,0,1,1-16-16A16,16,0,0,1,144,200Zm-16-40a8,8,0,0,0,8-8V48a8,8,0,0,0-16,0V152A8,8,0,0,0,128,160Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M140,200a12,12,0,1,1-12-12A12,12,0,0,1,140,200Zm-12-44a4,4,0,0,0,4-4V48a4,4,0,0,0-8,0V152A4,4,0,0,0,128,156Z" />
    </g>
  </svg>
</template>
