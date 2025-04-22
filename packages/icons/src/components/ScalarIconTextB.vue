/* GENERATED FILE */
<script lang="ts">
export default {
  name: 'ScalarIconTextB',
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
        d="M185.08,114.46A48,48,0,0,0,148,36H80A12,12,0,0,0,68,48V200a12,12,0,0,0,12,12h80a52,52,0,0,0,25.08-97.54ZM92,60h56a24,24,0,0,1,0,48H92Zm68,128H92V132h68a28,28,0,0,1,0,56Z" />
    </g>
    <g v-else-if="weight === 'duotone'">
      <path
        d="M200,160a40,40,0,0,1-40,40H80V48h68a36,36,0,0,1,0,72h12A40,40,0,0,1,200,160Z"
        opacity="0.2" />
      <path
        d="M178.48,115.7A44,44,0,0,0,148,40H80a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8h80a48,48,0,0,0,18.48-92.3ZM88,56h60a28,28,0,0,1,0,56H88Zm72,136H88V128h72a32,32,0,0,1,0,64Z" />
    </g>
    <g v-else-if="weight === 'fill'">
      <path
        d="M168,156a20,20,0,0,1-20,20H96V136h52A20,20,0,0,1,168,156ZM224,48V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48ZM184,156a36,36,0,0,0-18-31.15A36,36,0,0,0,140,64H88a8,8,0,0,0-8,8V184a8,8,0,0,0,8,8h60A36,36,0,0,0,184,156Zm-24-56a20,20,0,0,0-20-20H96v40h44A20,20,0,0,0,160,100Z" />
    </g>
    <g v-else-if="weight === 'light'">
      <path
        d="M174.69,116.41A42,42,0,0,0,148,42H80a6,6,0,0,0-6,6V200a6,6,0,0,0,6,6h80a46,46,0,0,0,14.69-89.59ZM86,54h62a30,30,0,0,1,0,60H86Zm74,140H86V126h74a34,34,0,0,1,0,68Z" />
    </g>
    <g v-else-if="weight === 'regular'">
      <path
        d="M178.48,115.7A44,44,0,0,0,148,40H80a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8h80a48,48,0,0,0,18.48-92.3ZM88,56h60a28,28,0,0,1,0,56H88Zm72,136H88V128h72a32,32,0,0,1,0,64Z" />
    </g>
    <g v-else-if="weight === 'thin'">
      <path
        d="M170.27,117.21A40,40,0,0,0,148,44H80a4,4,0,0,0-4,4V200a4,4,0,0,0,4,4h80a44,44,0,0,0,10.27-86.79ZM84,52h64a32,32,0,0,1,0,64H84Zm76,144H84V124h76a36,36,0,0,1,0,72Z" />
    </g>
  </svg>
</template>
