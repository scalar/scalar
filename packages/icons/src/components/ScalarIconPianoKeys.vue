/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconPianoKeys',
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
        d="M208,28H48A20,20,0,0,0,28,48V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V48A20,20,0,0,0,208,28ZM92,132V52h24v80Zm52,24v48H112V156Zm20-24H140V52h24ZM52,52H68v92a12,12,0,0,0,12,12h8v48H52ZM204,204H168V156h8a12,12,0,0,0,12-12V52h16Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M184,40V144H144V40ZM72,144h40V40H72Z"
        opacity="0.2" />
      <path
        d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM80,48h24v88H80Zm32,104a8,8,0,0,0,8-8V48h16v96a8,8,0,0,0,8,8h8v56H104V152Zm40-16V48h24v88ZM48,48H64v96a8,8,0,0,0,8,8H88v56H48ZM208,208H168V152h16a8,8,0,0,0,8-8V48h16V208Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM88,208H48V48H72v96a8,8,0,0,0,8,8h8Zm64,0H104V152h8a8,8,0,0,0,8-8V48h16v96a8,8,0,0,0,8,8h8Zm56,0H168V152h8a8,8,0,0,0,8-8V48h24V208Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M208,34H48A14,14,0,0,0,34,48V208a14,14,0,0,0,14,14H208a14,14,0,0,0,14-14V48A14,14,0,0,0,208,34ZM78,46h28v92H78Zm34,104a6,6,0,0,0,6-6V46h20v98a6,6,0,0,0,6,6h10v60H102V150Zm38-12V46h28v92ZM46,208V48a2,2,0,0,1,2-2H66v98a6,6,0,0,0,6,6H90v60H48A2,2,0,0,1,46,208Zm164,0a2,2,0,0,1-2,2H166V150h18a6,6,0,0,0,6-6V46h18a2,2,0,0,1,2,2Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM80,48h24v88H80Zm32,104a8,8,0,0,0,8-8V48h16v96a8,8,0,0,0,8,8h8v56H104V152Zm40-16V48h24v88ZM48,48H64v96a8,8,0,0,0,8,8H88v56H48ZM208,208H168V152h16a8,8,0,0,0,8-8V48h16V208Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M208,36H48A12,12,0,0,0,36,48V208a12,12,0,0,0,12,12H208a12,12,0,0,0,12-12V48A12,12,0,0,0,208,36ZM76,44h32v96H76Zm36,104a4,4,0,0,0,4-4V44h24V144a4,4,0,0,0,4,4h12v64H100V148Zm36-8V44h32v96ZM44,208V48a4,4,0,0,1,4-4H68V144a4,4,0,0,0,4,4H92v64H48A4,4,0,0,1,44,208Zm168,0a4,4,0,0,1-4,4H164V148h20a4,4,0,0,0,4-4V44h20a4,4,0,0,1,4,4Z" />
    </g>
  </svg>
</template>
