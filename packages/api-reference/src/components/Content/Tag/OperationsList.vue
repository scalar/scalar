<script setup lang="ts">
import type { Collection } from '@scalar/oas-utils/entities/spec'
import type { Tag } from '@scalar/types/legacy'
import { computed } from 'vue'

import { Card, CardContent, CardHeader } from '@/components/Card'
import ScreenReader from '@/components/ScreenReader.vue'

import OperationsListItem from './OperationsListItem.vue'

const props = defineProps<{
  tag: Tag
  collection: Collection
  isCollapsed?: boolean
}>()

const tagName = computed(() => props.tag['x-displayName'] ?? props.tag.name)
</script>

<template>
  <template v-if="tag.operations?.length > 0">
    <Card class="scalar-card-sticky">
      <CardHeader muted>
        <ScreenReader>{{ tagName }}</ScreenReader>
        Operations
      </CardHeader>
      <CardContent
        class="custom-scroll"
        muted>
        <ul
          :aria-label="`${tagName} endpoints`"
          class="endpoints">
          <OperationsListItem
            v-for="operation in tag.operations"
            :key="operation.id"
            :collection="collection"
            :isCollapsed="isCollapsed"
            :transformedOperation="operation" />
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
