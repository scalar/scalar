<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { TransformedOperation } from '@scalar/types/legacy'

defineProps<{ operation: TransformedOperation }>()
</script>
<template>
  <ScalarMarkdown
    :value="operation.description"
    withImages />
</template>
