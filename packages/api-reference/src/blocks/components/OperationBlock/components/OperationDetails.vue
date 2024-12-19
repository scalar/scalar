<script lang="ts" setup>
import { SectionHeader } from '@/components/Section'
import OperationParameters from '@/features/Operation/components/OperationParameters.vue'
import OperationResponses from '@/features/Operation/components/OperationResponses.vue'
import { ScalarMarkdown } from '@scalar/components'
import type { Request } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

const props = defineProps<{
  operation: Request
}>()

const title = computed(
  () => props.operation?.summary || props.operation?.path || '',
)
</script>

<template>
  <SectionHeader :level="3">
    {{ title }}
  </SectionHeader>
  <div class="operation-details">
    <ScalarMarkdown
      :value="operation.description"
      withImages />
    <OperationParameters :operation="operation" />
    <OperationResponses :operation="operation" />
  </div>
</template>
