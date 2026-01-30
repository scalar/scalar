<script setup lang="ts">
import { ScalarTooltip } from '@scalar/components'
import type { ApiReferenceConfigurationWithSource } from '@scalar/types/api-reference'

defineProps<{
  agentScalarConfiguration:
    | ApiReferenceConfigurationWithSource['agent']
    | undefined
}>()
</script>

<template>
  {{ agentScalarConfiguration }}
  <ScalarTooltip
    content="Visible in localhost only."
    placement="bottom">
    <slot />
  </ScalarTooltip>
</template>
