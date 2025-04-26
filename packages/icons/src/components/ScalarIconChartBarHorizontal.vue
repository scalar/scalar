/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconChartBarHorizontal',
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
        d="M224,92H188V56a12,12,0,0,0-12-12H60V40a12,12,0,0,0-24,0V216a12,12,0,0,0,24,0v-4h84a12,12,0,0,0,12-12V164h68a12,12,0,0,0,12-12V104A12,12,0,0,0,224,92ZM164,68V92H60V68ZM132,188H60V164h72Zm80-48H60V116H212Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M224,104v48H48V104Z"
        opacity="0.2" />
      <path
        d="M224,96H184V56a8,8,0,0,0-8-8H56V40a8,8,0,0,0-16,0V216a8,8,0,0,0,16,0v-8h88a8,8,0,0,0,8-8V160h72a8,8,0,0,0,8-8V104A8,8,0,0,0,224,96ZM168,64V96H56V64ZM136,192H56V160h80Zm80-48H56V112H216Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M232,112v32a8,8,0,0,1-8,8H56v16h88a8,8,0,0,1,8,8v24a8,8,0,0,1-8,8H56v8a8,8,0,0,1-16,0V40a8,8,0,0,1,16,0v8H176a8,8,0,0,1,8,8V80a8,8,0,0,1-8,8H56v16H224A8,8,0,0,1,232,112Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M224,98H182V56a6,6,0,0,0-6-6H54V40a6,6,0,0,0-12,0V216a6,6,0,0,0,12,0V206h90a6,6,0,0,0,6-6V158h74a6,6,0,0,0,6-6V104A6,6,0,0,0,224,98ZM170,62V98H54V62ZM138,194H54V158h84Zm80-48H54V110H218Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M224,96H184V56a8,8,0,0,0-8-8H56V40a8,8,0,0,0-16,0V216a8,8,0,0,0,16,0v-8h88a8,8,0,0,0,8-8V160h72a8,8,0,0,0,8-8V104A8,8,0,0,0,224,96ZM168,64V96H56V64ZM136,192H56V160h80Zm80-48H56V112H216Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M224,100H180V56a4,4,0,0,0-4-4H52V40a4,4,0,0,0-8,0V216a4,4,0,0,0,8,0V204h92a4,4,0,0,0,4-4V156h76a4,4,0,0,0,4-4V104A4,4,0,0,0,224,100ZM172,60v40H52V60ZM140,196H52V156h88Zm80-48H52V108H220Z" />
    </g>
  </svg>
</template>
