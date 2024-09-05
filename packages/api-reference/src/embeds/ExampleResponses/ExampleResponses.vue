<script lang="ts" setup>
import type { TransformedOperation } from '@scalar/types/legacy'

import { ExampleResponses } from '../../features/ExampleResponses'

defineProps<{
  operation?: TransformedOperation
}>()
</script>
<template>
  <div class="scalar-app">
    <ExampleResponses
      v-if="operation"
      :operation="operation" />
  </div>
</template>
