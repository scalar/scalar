<script setup lang="ts">
import { computed } from 'vue'

import { Card, CardContent, CardHeader } from '@/components/Card'
import ScreenReader from '@/components/ScreenReader.vue'
import type { TraversedTag } from '@/features/traverse-schema'
import type {
  TraversedOperation,
  TraversedWebhook,
} from '@/features/traverse-schema/types'

import OperationsListItem from './OperationsListItem.vue'

const { tag } = defineProps<{
  tag: TraversedTag
}>()

const operationsAndWebhooks = computed(
  (): (TraversedOperation | TraversedWebhook)[] => {
    return tag.children?.filter(
      (child) => 'operation' in child || 'webhook' in child,
    )
  },
)
</script>

<template>
  <template v-if="tag.children?.length > 0">
    <Card class="scalar-card-sticky">
      <CardHeader muted>
        <ScreenReader>{{ tag.title }}</ScreenReader>
        {{ tag.isWebhooks ? 'Webhooks' : 'Operations' }}
      </CardHeader>
      <CardContent
        class="custom-scroll"
        muted>
        <ul
          :aria-label="`${tag.title} endpoints`"
          class="endpoints">
          <OperationsListItem
            v-for="operationOrWebhook in operationsAndWebhooks"
            :key="operationOrWebhook.id"
            :operation="operationOrWebhook" />
        </ul>
      </CardContent>
    </Card>
  </template>
</template>

<style scoped>
.endpoints {
  overflow: auto;
  background: var(--scalar-background-2);
  padding: 10px 12px;
}
</style>
