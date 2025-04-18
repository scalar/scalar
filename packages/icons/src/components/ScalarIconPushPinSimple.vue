/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconPushPinSimple',
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
        d="M216,164h-5.93L190.3,52H192a12,12,0,0,0,0-24H64a12,12,0,0,0,0,24h1.7L45.93,164H40a12,12,0,0,0,0,24h76v52a12,12,0,0,0,24,0V188h76a12,12,0,0,0,0-24ZM90.07,52h75.86L185.7,164H70.3Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M200,176H56L80,40h96Z"
        opacity="0.2" />
      <path
        d="M216,168h-9.29L185.54,48H192a8,8,0,0,0,0-16H64a8,8,0,0,0,0,16h6.46L49.29,168H40a8,8,0,0,0,0,16h80v56a8,8,0,0,0,16,0V184h80a8,8,0,0,0,0-16ZM86.71,48h82.58l21.17,120H65.54Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M224,176a8,8,0,0,1-8,8H136v56a8,8,0,0,1-16,0V184H40a8,8,0,0,1,0-16h9.29L70.46,48H64a8,8,0,0,1,0-16H192a8,8,0,0,1,0,16h-6.46l21.17,120H216A8,8,0,0,1,224,176Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M216,170H205L183.15,46H192a6,6,0,0,0,0-12H64a6,6,0,0,0,0,12h8.85L51,170H40a6,6,0,0,0,0,12h82v58a6,6,0,0,0,12,0V182h82a6,6,0,0,0,0-12ZM85,46H171l21.88,124H63.15Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M216,168h-9.29L185.54,48H192a8,8,0,0,0,0-16H64a8,8,0,0,0,0,16h6.46L49.29,168H40a8,8,0,0,0,0,16h80v56a8,8,0,0,0,16,0V184h80a8,8,0,0,0,0-16ZM86.71,48h82.58l21.17,120H65.54Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M216,172H203.36L180.77,44H192a4,4,0,0,0,0-8H64a4,4,0,0,0,0,8H75.23L52.64,172H40a4,4,0,0,0,0,8h84v60a4,4,0,0,0,8,0V180h84a4,4,0,0,0,0-8ZM83.36,44h89.28l22.59,128H60.77Z" />
    </g>
  </svg>
</template>
