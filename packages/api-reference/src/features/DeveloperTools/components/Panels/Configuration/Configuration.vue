<script setup lang="ts">
import { ScalarCodeBlock } from '@scalar/components'
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'

defineProps<{
  configuration?: Partial<AnyApiReferenceConfiguration>
}>()
</script>

<template>
  <h2 class="mb-3">Configuration</h2>
  <template v-if="configuration">
    <ScalarCodeBlock
      class="max-w-10 border"
      :content="configuration"
      lang="json" />
  </template>
</template>
