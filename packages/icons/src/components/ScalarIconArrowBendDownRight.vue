/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconArrowBendDownRight',
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
        d="M232.49,160.49l-48,48a12,12,0,0,1-17-17L195,164H128A108.12,108.12,0,0,1,20,56a12,12,0,0,1,24,0,84.09,84.09,0,0,0,84,84h67l-27.52-27.51a12,12,0,0,1,17-17l48,48A12,12,0,0,1,232.49,160.49Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M224,152l-48,48V104Z"
        opacity="0.2" />
      <path
        d="M229.66,146.34l-48-48A8,8,0,0,0,168,104v40H128A88.1,88.1,0,0,1,40,56a8,8,0,0,0-16,0A104.11,104.11,0,0,0,128,160h40v40a8,8,0,0,0,13.66,5.66l48-48A8,8,0,0,0,229.66,146.34ZM184,180.69V123.31L212.69,152Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M229.66,157.66l-48,48A8,8,0,0,1,168,200V160H128A104.11,104.11,0,0,1,24,56a8,8,0,0,1,16,0,88.1,88.1,0,0,0,88,88h40V104a8,8,0,0,1,13.66-5.66l48,48A8,8,0,0,1,229.66,157.66Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M228.24,156.24l-48,48a6,6,0,0,1-8.48-8.48L209.51,158H128A102.12,102.12,0,0,1,26,56a6,6,0,0,1,12,0,90.1,90.1,0,0,0,90,90h81.51l-37.75-37.76a6,6,0,0,1,8.48-8.48l48,48A6,6,0,0,1,228.24,156.24Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M229.66,157.66l-48,48a8,8,0,0,1-11.32-11.32L204.69,160H128A104.11,104.11,0,0,1,24,56a8,8,0,0,1,16,0,88.1,88.1,0,0,0,88,88h76.69l-34.35-34.34a8,8,0,0,1,11.32-11.32l48,48A8,8,0,0,1,229.66,157.66Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M226.83,154.83l-48,48a4,4,0,0,1-5.66-5.66L214.34,156H128A100.11,100.11,0,0,1,28,56a4,4,0,0,1,8,0,92.1,92.1,0,0,0,92,92h86.34l-41.17-41.17a4,4,0,0,1,5.66-5.66l48,48A4,4,0,0,1,226.83,154.83Z" />
    </g>
  </svg>
</template>
