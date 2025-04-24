<script setup lang="ts">
import { isLocalUrl } from '@scalar/oas-utils/helpers'
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import { useLocalStorage } from '@vueuse/core'

import FloatingButton from '@/features/DeveloperTools/components/FloatingButton.vue'

defineProps<{
  configuration?: Partial<AnyApiReferenceConfiguration>
}>()

const isOpen = useLocalStorage('devtools.is-open', false)

/** Tabs configuration for the developer tools panel */
const tabs = [
  { id: 'console', label: 'Console', icon: 'Terminal' },
  { id: 'configuration', label: 'Configuration', icon: 'Settings' },
] as const

/** Show developer tools locally */
const shouldShow =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' && isLocalUrl(window.location.href))
</script>

<template>
  <template v-if="shouldShow">
    <!-- TODO: Refactor into meaningful components -->
    <FloatingButton
      v-model="isOpen"
      :configuration="configuration" />
  </template>
</template>
