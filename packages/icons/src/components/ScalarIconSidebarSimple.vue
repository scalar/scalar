/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconSidebarSimple',
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
        d="M216,36H40A20,20,0,0,0,20,56V200a20,20,0,0,0,20,20H216a20,20,0,0,0,20-20V56A20,20,0,0,0,216,36ZM44,60H76V196H44ZM212,196H100V60H212Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M88,48V208H40a8,8,0,0,1-8-8V56a8,8,0,0,1,8-8Z"
        opacity="0.2" />
      <path
        d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H80V200H40ZM216,200H96V56H216V200Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H88V56H216V200Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M216,42H40A14,14,0,0,0,26,56V200a14,14,0,0,0,14,14H216a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42ZM38,200V56a2,2,0,0,1,2-2H82V202H40A2,2,0,0,1,38,200Zm180,0a2,2,0,0,1-2,2H94V54H216a2,2,0,0,1,2,2Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H80V200H40ZM216,200H96V56H216V200Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M216,44H40A12,12,0,0,0,28,56V200a12,12,0,0,0,12,12H216a12,12,0,0,0,12-12V56A12,12,0,0,0,216,44ZM36,200V56a4,4,0,0,1,4-4H84V204H40A4,4,0,0,1,36,200Zm184,0a4,4,0,0,1-4,4H92V52H216a4,4,0,0,1,4,4Z" />
    </g>
  </svg>
</template>
