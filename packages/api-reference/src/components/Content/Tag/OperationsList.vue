<script setup lang="ts">
import {
  ScalarCard,
  ScalarCardHeader,
  ScalarCardSection,
} from '@scalar/components'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import type { Tag } from '@scalar/types/legacy'
import { computed } from 'vue'

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
    <ScalarCard class="endpoints-card">
      <ScalarCardHeader>
        <ScreenReader>{{ tagName }}</ScreenReader>
        Operations
      </ScalarCardHeader>
      <ScalarCardSection class="custom-scroll">
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
      </ScalarCardSection>
    </ScalarCard>
  </template>
</template>

<style scoped>
.endpoints-card {
  position: sticky;
  top: calc(var(--refs-header-height) + 24px);
  font-size: var(--scalar-font-size-3);
}
.endpoints {
  overflow: auto;
  background: var(--scalar-background-2);
  padding: 10px 12px;
}
</style>
