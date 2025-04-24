<script setup lang="ts">
import { isLocalUrl } from '@scalar/oas-utils/helpers'
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import { useLocalStorage } from '@vueuse/core'

import FloatingButton from '@/features/DeveloperTools/components/FloatingButton.vue'

defineProps<{
  configuration?: Partial<AnyApiReferenceConfiguration>
}>()

const emit = defineEmits<{
  (
    e: 'update:configuration',
    value: Partial<AnyApiReferenceConfiguration>,
  ): void
}>()

const isOpen = useLocalStorage('devtools.is-open', false)

/** Show developer tools locally */
const shouldShow =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' && isLocalUrl(window.location.href))

const updateConfiguration = (value: Partial<AnyApiReferenceConfiguration>) => {
  emit('update:configuration', value)
}
</script>

<template>
  <template v-if="shouldShow">
    <!-- TODO: Refactor into meaningful components -->
    <div class="dark-mode text-c-1">
      <FloatingButton
        v-model="isOpen"
        :configuration="configuration"
        @update:configuration="updateConfiguration" />
    </div>
  </template>
</template>
