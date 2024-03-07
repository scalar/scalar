<script setup lang="ts">
/**
 * This definition provides type safety for the other layouts by requiring the
 * use of ReferenceProps & ReferenceSlots
 */
import { onMounted } from 'vue'

import type { ReferenceLayoutProps, ReferenceSlots } from '../../types'

// eslint-disable-next-line vue/no-unused-properties
defineProps<ReferenceLayoutProps>()
defineEmits<{
  (e: 'toggleDarkMode'): void
}>()

defineSlots<ReferenceSlots>()

onMounted(() => {
  throw new Error('DO NOT RENDER THE BASE LAYOUT')
})
</script>
<template>
  <slot name="footer" />
</template>
