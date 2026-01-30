<script setup lang="ts">
import { ScalarTooltip } from '@scalar/components'
import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import type { ApiReferenceConfigurationWithSource } from '@scalar/types/api-reference'
import { computed } from 'vue'

const { agentScalarConfiguration } = defineProps<{
  agentScalarConfiguration:
    | ApiReferenceConfigurationWithSource['agent']
    | undefined
}>()

const content = computed((): string | undefined => {
  // We're in production
  if (typeof window !== 'undefined' && !isLocalUrl(window.location.href)) {
    return undefined
  }

  // We have a key
  if (agentScalarConfiguration?.key) {
    return undefined
  }

  // We don't have a key
  return 'Available in development only.'
})
</script>

<template>
  <template v-if="content">
    <!-- Tooltip in development -->
    <ScalarTooltip
      :content
      placement="bottom">
      <slot />
    </ScalarTooltip>
  </template>
  <template v-else>
    <!-- No tooltip -->
    <slot />
  </template>
</template>
